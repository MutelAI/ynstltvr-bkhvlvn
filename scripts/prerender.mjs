/**
 * scripts/prerender.mjs
 *
 * Post-build SSG script.  Run after:
 *   1. `vite build`          → dist/
 *   2. `vite build --ssr`    → dist-ssr/
 *
 * What it does:
 *   a) Reads dist/index.html (the Vite-built shell)
 *   b) Reads public/data/business.json
 *   c) Calls render(data) from the SSR bundle to get pre-rendered HTML
 *   d) Injects the HTML into <div id="root">
 *   e) Replaces the runtime fetch() script with inline JSON so the page
 *      loads with zero async data round-trips (true SSG behaviour)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const clientHtmlPath  = resolve(root, 'dist/index.html');
const ssrBundlePath   = resolve(root, 'dist-ssr/entry-server.js');
const dataPath        = resolve(root, 'public/data/business.json');

// ── Guard: skip gracefully if no business data (template build) ────────────
if (!existsSync(dataPath)) {
  console.log('ℹ  prerender: no business.json found – skipping (template build).');
  process.exit(0);
}

if (!existsSync(ssrBundlePath)) {
  console.error('✗  prerender: SSR bundle not found at dist-ssr/entry-server.js');
  console.error('   Make sure `vite build --ssr` ran before this script.');
  process.exit(1);
}

// ── Minimal browser-global polyfills required by motion/react in Node ─────
if (typeof window === 'undefined') {
  globalThis.window = /** @type {any} */ ({});
}
if (typeof document === 'undefined') {
  globalThis.document = /** @type {any} */ ({
    cookie: '',
    createElement: () => ({}),
    createElementNS: () => ({}),
    querySelector: () => null,
    querySelectorAll: () => [],
    body: { style: {} },
    head: { appendChild: () => {} },
  });
}
if (typeof navigator === 'undefined') {
  globalThis.navigator = /** @type {any} */ ({ userAgent: 'Node.js SSR' });
}
if (typeof location === 'undefined') {
  globalThis.location = /** @type {any} */ ({
    origin: '',
    pathname: '/',
    search: '',
    hash: '',
    href: '/',
  });
}
if (typeof requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  globalThis.cancelAnimationFrame  = (id) => clearTimeout(id);
}
if (typeof matchMedia === 'undefined') {
  globalThis.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
}
if (typeof IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  };
}
if (typeof ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe()    {}
    unobserve()  {}
    disconnect() {}
  };
}

// ── Load business data ─────────────────────────────────────────────────────
const businessJson = JSON.parse(readFileSync(dataPath, 'utf-8'));

// ── Render ─────────────────────────────────────────────────────────────────
let render;
try {
  ({ render } = await import(ssrBundlePath));
} catch (err) {
  console.error('✗  prerender: failed to import SSR bundle:', err.message);
  process.exit(1);
}

let appHtml;
try {
  appHtml = render(businessJson);
} catch (err) {
  console.error('✗  prerender: renderToString failed:', err.message);
  console.error('   Falling back to client-side rendering (no prerender).');
  appHtml = null;
}

// ── Patch dist/index.html ──────────────────────────────────────────────────
let html = readFileSync(clientHtmlPath, 'utf-8');

// (a) Inject pre-rendered HTML
if (appHtml) {
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );
}

// (b) Inline business data → eliminates the async fetch() on first load
//     Serialise safely: escape </script> sequences that would break the tag.
const inlineData = JSON.stringify(businessJson).replace(/<\/script>/gi, '<\\/script>');
html = html.replace(
  /window\.__bizData\s*=\s*fetch\([^;]+;/,
  `window.__bizData = Promise.resolve(${inlineData});`,
);

writeFileSync(clientHtmlPath, html, 'utf-8');
console.log('✓  SSG prerender complete' + (appHtml ? ' (HTML pre-rendered)' : ' (data inlined only)'));
