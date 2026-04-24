import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Finds all sibling version folders for the current site.
 * e.g. if root is output/MyBusiness_v2, returns [MyBusiness, MyBusiness_v2, ...]
 */
function findSiblingVersions(root: string): { folder: string; version: number; isCurrent: boolean; businessJsonPath: string }[] {
  const parentDir = path.dirname(root);
  const currentFolder = path.basename(root);
  const baseMatch = currentFolder.match(/^(.+?)(_v\d+)?$/);
  const baseName = baseMatch ? baseMatch[1] : currentFolder;
  if (!fs.existsSync(parentDir)) return [];
  const entries = fs.readdirSync(parentDir, { withFileTypes: true });
  const versions: { folder: string; version: number; isCurrent: boolean; businessJsonPath: string }[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name === baseName) {
      const bjPath = path.join(parentDir, name, 'public', 'data', 'business.json');
      if (fs.existsSync(bjPath)) {
        versions.push({ folder: name, version: 1, isCurrent: name === currentFolder, businessJsonPath: bjPath });
      }
    } else {
      const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = name.match(new RegExp(`^${escaped}_v(\\d+)$`));
      if (m) {
        const bjPath = path.join(parentDir, name, 'public', 'data', 'business.json');
        if (fs.existsSync(bjPath)) {
          versions.push({ folder: name, version: parseInt(m[1], 10), isCurrent: name === currentFolder, businessJsonPath: bjPath });
        }
      }
    }
  }
  return versions.sort((a, b) => a.version - b.version);
}

/** Stage and commit business.json; returns commit info or error. */
function gitCommitJson(filePath: string, cwd: string): { committed: boolean; hash?: string; error?: string } {
  try {
    execSync(`git add "${filePath}"`, { cwd, stdio: 'pipe' });
    const timestamp = new Date().toLocaleString('en-GB', { hour12: false });
    execSync(`git commit -m "edit-mode: save ${timestamp}"`, { cwd, stdio: 'pipe' });
    const hash = execSync('git rev-parse --short HEAD', { cwd, stdio: 'pipe' }).toString().trim();
    return { committed: true, hash };
  } catch (e: any) {
    if (e.stdout?.toString().includes('nothing to commit')) {
      return { committed: false, error: 'No changes to commit' };
    }
    return { committed: false, error: e.message };
  }
}

/**
 * Dev-only plugin: handles PUT /api/save-business, GET /api/versions, GET /api/version-data.
 * Writes business.json and auto-commits to Git so every edit is preserved in history.
 */
function editSavePlugin(): Plugin {
  return {
    name: 'edit-save-business',
    configureServer(server) {
      // Prevent browser from caching business.json so edits show up on refresh
      server.middlewares.use('/data/business.json', (_req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
      });

      // List all sibling versions
      server.middlewares.use('/api/versions', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method not allowed'); return; }
        try {
          const versions = findSiblingVersions(server.config.root);
          const result = versions.map(v => ({
            folder: v.folder,
            version: v.version,
            isCurrent: v.isCurrent,
            label: v.version === 1 ? 'v1 (original)' : `v${v.version}`,
          }));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // Get a specific version's business.json
      server.middlewares.use('/api/version-data', (req, res) => {
        if (req.method !== 'GET') { res.statusCode = 405; res.end('Method not allowed'); return; }
        const url = new URL(req.url!, `http://${req.headers.host}`);
        const folder = url.searchParams.get('folder');
        if (!folder) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing folder param' })); return; }
        if (/[/\\]|\.\./.test(folder)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Invalid folder name' })); return; }
        const versions = findSiblingVersions(server.config.root);
        const match = versions.find(v => v.folder === folder);
        if (!match) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Version not found' })); return; }
        try {
          const data = fs.readFileSync(match.businessJsonPath, 'utf-8');
          JSON.parse(data); // validate
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      // Save business.json and commit to Git
      server.middlewares.use('/api/save-business', (req, res) => {
        if (req.method !== 'PUT') { res.statusCode = 405; res.end('Method not allowed'); return; }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf-8');
            JSON.parse(body); // validate before writing
            const target = path.resolve(server.config.root, 'public/data/business.json');
            fs.writeFileSync(target, body, 'utf-8');
            const gitResult = gitCommitJson(target, server.config.root);
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ ok: true, git: gitResult }));
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

/**
 * Production-only plugin: inlines public/data/business.json directly into
 * index.html so the page loads with zero async data round-trips.
 * Falls back silently when the file doesn't exist (template/dev builds).
 */
function inlineBusinessDataPlugin(): Plugin {
  return {
    name: 'inline-business-data',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // Only run during production client build (not SSR, not dev)
        if (!ctx.bundle) return;
        const dataPath = path.resolve(__dirname, 'public/data/business.json');
        if (!fs.existsSync(dataPath)) return;
        try {
          const raw  = fs.readFileSync(dataPath, 'utf-8');
          const data = JSON.parse(raw); // validate
          const safe = JSON.stringify(data).replace(/<\/script>/gi, '<\\/script>');
          return html.replace(
            /window\.__bizData\s*=\s*fetch\([^;]+;/,
            `window.__bizData = Promise.resolve(${safe});`,
          );
        } catch {
          return; // leave the fetch() in-place if JSON is malformed
        }
      },
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [editSavePlugin(), react(), tailwindcss(), inlineBusinessDataPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: isSsrBuild ? 'dist-ssr' : 'dist',
    // SSR build: compile entry-server.tsx as a Node-compatible CJS/ESM module
    ...(isSsrBuild && { ssr: 'src/entry-server.tsx' }),
    rollupOptions: isSsrBuild
      ? {
          // SSR output: single ES module, no manualChunks
          output: { format: 'es' },
        }
      : {
          input: {
            main:    'index.html',
            preview: 'preview.html',
          },
          output: {
            manualChunks: {
              react:  ['react', 'react-dom'],
              motion: ['motion'],
            },
          },
        },
  },
}));
