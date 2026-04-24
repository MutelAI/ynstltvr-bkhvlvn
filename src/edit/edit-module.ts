/**
 * Lazy-loaded edit module for v2 React template.
 * Code-split — never downloaded by regular visitors.
 *
 * Approach: make ALL visible text elements editable (no data-attributes needed).
 * Changes are tracked as {original → new} text pairs and applied to business.json
 * by searching for matching string values recursively.
 *
 * For i18n UI labels (section titles, buttons, etc.) that come from DEFAULTS,
 * changes are written as overrides into translations{}.
 */

import { I18N_DEFAULTS } from '@/i18nDefaults';

// ── Types ────────────────────────────────────────────────────────────────────

interface BusinessJson {
  business: Record<string, any>;
  hours: any[];
  services: any[];
  reviews: any[];
  photos: any[];
  translations: Record<string, { he: string; en: string }>;
  design?: Record<string, any>;
  hidden_sections?: string[];
}

// ── State ────────────────────────────────────────────────────────────────────

let originalData: BusinessJson;
let mutatedData: BusinessJson;
let activeToken = '';  // token from the ?edit= URL param, used for API calls
let toolbar: HTMLElement;
let editStyleEl: HTMLStyleElement;
let observer: MutationObserver | null = null;
const processed = new WeakSet<Element>();
const textChanges = new Map<string, string>();

// Version picker state
interface VersionInfo {
  folder: string;
  version: number;
  isCurrent: boolean;
  label: string;
}
let versionPanel: HTMLElement | null = null;
let versionsList: VersionInfo[] = [];
let previewingVersion: VersionInfo | null = null;
let domainPanel: HTMLElement | null = null;

/** Elements to skip — interactive / structural. */
const SKIP_SELECTORS = '#edit-toolbar, #domain-panel, .edit-toast, .edit-delete-btn, .edit-section-delete-btn, .edit-hide-btn, .edit-img-overlay, script, style, svg, iframe, input, textarea, select, noscript';

// ── Public entry point ───────────────────────────────────────────────────────

export async function initEditMode(token: string): Promise<void> {
  activeToken = token;
  const valid = await verifyToken(token);
  if (!valid) {
    console.warn('[edit-mode] Invalid token — edit mode not activated.');
    return;
  }

  originalData = await (window as any).__bizData;
  mutatedData = structuredClone(originalData);

  injectStyles();
  createToolbar();
  document.body.classList.add('edit-mode-active');

  // Process what's already rendered
  scanAndProcess();

  // Watch for new elements (React lazy/suspense)
  observer = new MutationObserver(() => scanAndProcess());
  observer.observe(document.body, { childList: true, subtree: true });

  // Backup scans for timing edge cases (lazy components)
  for (const delay of [300, 800, 2000, 4000, 8000]) {
    setTimeout(() => scanAndProcess(), delay);
  }

  showToast('✏️ Edit mode active — click any text to edit it');
}

// ── Token verification ───────────────────────────────────────────────────────

async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/verify-token?token=${encodeURIComponent(token)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ── Scan DOM for all text elements ───────────────────────────────────────────

function scanAndProcess(): void {
  // Text elements
  const allElements = document.querySelectorAll<HTMLElement>(
    'h1,h2,h3,h4,h5,h6,p,span,a,button,div,label,li,td,th,figcaption,blockquote'
  );

  allElements.forEach(el => {
    if (processed.has(el)) return;
    if (el.closest(SKIP_SELECTORS)) return;
    if (!isLeafText(el)) return;

    const text = el.innerText.trim();
    if (!text || text.length < 2) return;

    processed.add(el);
    makeEditable(el);
  });

  // Logo (emoji → image upload)
  document.querySelectorAll<HTMLElement>('[data-edit-logo]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupLogoEditable(el);
  });

  // Images
  document.querySelectorAll<HTMLElement>('[data-edit-img]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupImageEditable(el);
  });

  // Deletable list items
  document.querySelectorAll<HTMLElement>('[data-edit-delete]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupDeleteButton(el);
  });

  // Deletable sections
  document.querySelectorAll<HTMLElement>('[data-edit-section]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupSectionDelete(el);
  });

  // Hideable individual elements (e.g. nav buttons)
  document.querySelectorAll<HTMLElement>('[data-edit-hide]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupHideButton(el);
  });

  // Add-photo containers
  document.querySelectorAll<HTMLElement>('[data-edit-add-photo]').forEach(el => {
    if (processed.has(el)) return;
    processed.add(el);
    setupAddPhotoContainer(el);
  });
}

/**
 * Returns true if the element has meaningful direct text content
 * (not just whitespace distributed across child elements).
 */
function isLeafText(el: HTMLElement): boolean {
  const text = el.innerText?.trim();
  if (!text) return false;

  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }

  const childTextEls = el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,div');
  if (childTextEls.length === 0) return true;

  return false;
}

// ── Make any element editable ────────────────────────────────────────────────

function makeEditable(el: HTMLElement): void {
  el.classList.add('edit-hoverable');

  const originalText = el.innerText.trim();
  el.setAttribute('data-edit-original', originalText);

  el.addEventListener('click', function handler(e) {
    if (el.contentEditable === 'true') return;
    e.preventDefault();
    e.stopPropagation();

    el.contentEditable = 'true';
    el.classList.add('edit-active');
    el.focus();

    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  el.addEventListener('blur', () => {
    el.contentEditable = 'false';
    el.classList.remove('edit-active');

    const newText = el.innerText.trim();
    const orig = el.getAttribute('data-edit-original') || '';
    if (newText !== orig) {
      textChanges.set(orig, newText);
      applyChangeToJson(orig, newText);
      el.setAttribute('data-edit-original', newText);
      markDirty();
    }
  });

  el.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      el.blur();
    }
    if (e.key === 'Escape') {
      el.innerText = el.getAttribute('data-edit-original') || '';
      el.blur();
    }
  });
}

// ── Apply text change to business.json by content matching ───────────────────

let i18nReverseLookup: Map<string, { key: string; lang: 'he' | 'en' }> | null = null;

function getI18nReverseLookup(): Map<string, { key: string; lang: 'he' | 'en' }> {
  if (i18nReverseLookup) return i18nReverseLookup;
  i18nReverseLookup = new Map();

  for (const [key, entry] of Object.entries(I18N_DEFAULTS)) {
    if (entry.he) i18nReverseLookup.set(entry.he, { key, lang: 'he' });
    if (entry.en) i18nReverseLookup.set(entry.en, { key, lang: 'en' });
  }

  if (mutatedData.translations) {
    for (const [key, entry] of Object.entries(mutatedData.translations)) {
      if (entry.he) i18nReverseLookup.set(entry.he, { key, lang: 'he' });
      if (entry.en) i18nReverseLookup.set(entry.en, { key, lang: 'en' });
    }
  }

  return i18nReverseLookup;
}

function applyChangeToJson(originalText: string, newText: string): void {
  // 1. Try regular content matching in the full JSON tree
  replaceInObject(mutatedData, originalText, newText);

  // 2. Check if this text is an i18n label (from DEFAULTS or translations)
  const lookup = getI18nReverseLookup();
  const match = lookup.get(originalText);
  if (match) {
    if (!mutatedData.translations) mutatedData.translations = {} as any;
    if (!mutatedData.translations[match.key]) {
      const def = I18N_DEFAULTS[match.key];
      mutatedData.translations[match.key] = def
        ? { he: def.he, en: def.en }
        : { he: '', en: '' };
    }
    (mutatedData.translations[match.key] as any)[match.lang] = newText;
    lookup.delete(originalText);
    lookup.set(newText, match);
  }
}

function replaceInObject(obj: any, find: string, replace: string): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      if (val === find) {
        obj[key] = replace;
      } else if (val.includes(find) && find.length >= 10) {
        obj[key] = val.replace(find, replace);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'string' && item === find) {
          val[i] = replace;
        } else if (typeof item === 'object') {
          replaceInObject(item, find, replace);
        }
      });
    } else if (typeof val === 'object') {
      replaceInObject(val, find, replace);
    }
  }
}

// ── Image editing ────────────────────────────────────────────────────────────

function setupImageEditable(container: HTMLElement): void {
  const img = container.querySelector('img');
  if (!img) return;

  container.classList.add('edit-img-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'edit-img-overlay';
  overlay.innerHTML = '📷 Replace image';
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickImage(img, container.getAttribute('data-edit-img')!);
  });
  container.style.position = 'relative';
  container.appendChild(overlay);
}

function pickImage(img: HTMLImageElement, key: string): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      img.src = dataUrl;
      setNestedValue(mutatedData, key, dataUrl);
      markDirty();
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── Logo editing ─────────────────────────────────────────────────────────────

function setupLogoEditable(container: HTMLElement): void {
  container.classList.add('edit-img-wrap');
  const overlay = document.createElement('div');
  overlay.className = 'edit-img-overlay edit-logo-overlay';
  overlay.innerHTML = '📷 Upload logo';
  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickLogoImage(container);
  });
  container.appendChild(overlay);
}

function pickLogoImage(container: HTMLElement): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      mutatedData.business.logo_url = dataUrl;
      mutatedData.business.logo_emoji = '';

      const existingImg = container.querySelector('img') as HTMLImageElement | null;
      const emojiSpan = container.querySelector('span') as HTMLElement | null;
      if (existingImg) {
        existingImg.src = dataUrl;
      } else if (emojiSpan) {
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = mutatedData.business?.name || '';
        img.className = 'h-10 w-auto max-w-[120px] object-contain';
        emojiSpan.replaceWith(img);
      }

      markDirty();
      showToast('✅ Logo updated — save to persist');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

// ── Add photo to gallery ─────────────────────────────────────────────────────

function setupAddPhotoContainer(galleryContainer: HTMLElement): void {
  const key = galleryContainer.getAttribute('data-edit-add-photo')!;

  const addCard = document.createElement('div');
  addCard.className = 'edit-add-photo-btn';
  addCard.setAttribute('data-edit-ui', 'add-photo');

  if (galleryContainer.classList.contains('grid')) {
    addCard.style.aspectRatio = '1 / 1';
  } else if (galleryContainer.classList.contains('overflow-x-auto')) {
    addCard.style.flexShrink = '0';
    addCard.style.width = '18rem';
    addCard.style.minHeight = '14rem';
  }

  addCard.innerHTML = `<span style="font-size:2.2rem;line-height:1">+</span><span>Add photo</span>`;
  addCard.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    pickAndAddPhoto(galleryContainer, key, addCard);
  });
  galleryContainer.appendChild(addCard);
}

function pickAndAddPhoto(galleryContainer: HTMLElement, key: string, addCard: HTMLElement): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.onchange = () => {
    Array.from(input.files ?? []).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const arr = (mutatedData as any)[key] as any[];
        arr.push({ url: dataUrl, thumb: dataUrl, source: 'owner', alt_he: 'Photo', alt_en: 'Photo' });
        const newIndex = arr.length - 1;

        const tile = document.createElement('div');
        tile.setAttribute('data-edit-delete', `${key}.${newIndex}`);
        tile.setAttribute('data-edit-img', `${key}.${newIndex}.url`);

        if (galleryContainer.classList.contains('grid')) {
          tile.className = 'aspect-square cursor-pointer overflow-hidden rounded-xl relative group';
        } else if (galleryContainer.classList.contains('overflow-x-auto')) {
          tile.className = 'snap-center shrink-0 w-72 cursor-pointer overflow-hidden rounded-xl relative group';
        } else {
          tile.className = 'break-inside-avoid cursor-pointer overflow-hidden rounded-xl relative group';
        }

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Photo';
        img.className = 'w-full object-cover';
        tile.appendChild(img);

        galleryContainer.insertBefore(tile, addCard);
        setupDeleteButton(tile);
        setupImageEditable(tile);

        markDirty();
        showToast('✅ Photo added');
      };
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

// ── List item deletion ───────────────────────────────────────────────────────

function setupDeleteButton(el: HTMLElement): void {
  const btn = document.createElement('button');
  btn.className = 'edit-delete-btn';
  btn.innerHTML = '🗑️';
  btn.title = 'Delete item';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Delete this item?')) return;
    const key = el.getAttribute('data-edit-delete')!;
    const [arrayName, indexStr] = key.split('.');
    const index = parseInt(indexStr, 10);
    const arr = (mutatedData as any)[arrayName];
    if (Array.isArray(arr) && index >= 0 && index < arr.length) {
      arr.splice(index, 1);
      el.style.transition = 'all 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.95)';
      setTimeout(() => el.remove(), 300);
      markDirty();
    }
  });
  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── Element hide button (data-edit-hide) ─────────────────────────────────────

function setupHideButton(el: HTMLElement): void {
  const btn = document.createElement('button');
  btn.className = 'edit-hide-btn';
  btn.innerHTML = '✕';
  btn.title = 'Hide this button';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const key = el.getAttribute('data-edit-hide')!;
    if (!mutatedData.hidden_sections) mutatedData.hidden_sections = [];
    if (!mutatedData.hidden_sections.includes(key)) {
      mutatedData.hidden_sections.push(key);
    }

    el.style.transition = 'all 0.3s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.9)';
    setTimeout(() => el.remove(), 300);
    markDirty();
  });

  el.appendChild(btn);
}

// ── Section deletion ─────────────────────────────────────────────────────────

function setupSectionDelete(el: HTMLElement): void {
  el.classList.add('edit-section-deletable');

  const btn = document.createElement('button');
  btn.className = 'edit-section-delete-btn';
  btn.innerHTML = '🗑️ Remove section';
  btn.title = 'Remove this section';

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    const sectionKey = el.getAttribute('data-edit-section')!;
    if (!confirm(`Remove "${sectionKey}" section?`)) return;

    el.style.transition = 'all 0.4s ease';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.97)';
    el.style.maxHeight = el.offsetHeight + 'px';
    setTimeout(() => {
      el.style.maxHeight = '0';
      el.style.overflow = 'hidden';
      el.style.paddingTop = '0';
      el.style.paddingBottom = '0';
      el.style.marginTop = '0';
      el.style.marginBottom = '0';
    }, 400);
    setTimeout(() => el.remove(), 800);

    if (!mutatedData.hidden_sections) mutatedData.hidden_sections = [];
    if (!mutatedData.hidden_sections.includes(sectionKey)) {
      mutatedData.hidden_sections.push(sectionKey);
    }
    markDirty();
  });

  el.style.position = 'relative';
  el.appendChild(btn);
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

function createToolbar(): void {
  toolbar = document.createElement('div');
  toolbar.id = 'edit-toolbar';
  toolbar.innerHTML = `
    <span class="edit-toolbar-label">✏️ Edit Mode</span>
    <button id="edit-btn-versions">📋 Versions</button>
    <button id="edit-btn-save">💾 Save</button>
    <button id="edit-btn-deploy">🚀 Deploy</button>
    <button id="edit-btn-domain">🌐 Domain</button>
    <button id="edit-btn-cancel">✖ Exit</button>
  `;
  document.body.appendChild(toolbar);
  toolbar.querySelector('#edit-btn-versions')!.addEventListener('click', toggleVersionPanel);
  toolbar.querySelector('#edit-btn-save')!.addEventListener('click', save);
  toolbar.querySelector('#edit-btn-deploy')!.addEventListener('click', triggerDeploy);
  toolbar.querySelector('#edit-btn-domain')!.addEventListener('click', openDomainPanel);
  toolbar.querySelector('#edit-btn-cancel')!.addEventListener('click', cancel);
}

// ── Version picker ───────────────────────────────────────────────────────────

async function toggleVersionPanel(): Promise<void> {
  if (versionPanel) {
    closeVersionPanel();
    return;
  }

  try {
    const res = await fetch('/api/versions');
    if (!res.ok) throw new Error('Failed to fetch versions');
    versionsList = await res.json();
  } catch {
    showToast('⚠️ Could not load versions');
    return;
  }

  if (versionsList.length <= 1) {
    showToast('ℹ️ No other versions found');
    return;
  }

  versionPanel = document.createElement('div');
  versionPanel.id = 'version-panel';
  versionPanel.innerHTML = `
    <div class="version-panel-header">
      <span>📋 JSON Versions</span>
      <button id="version-panel-close">✕</button>
    </div>
    <div class="version-panel-list">
      ${versionsList.map(v => `
        <div class="version-item${v.isCurrent ? ' version-current' : ''}" data-folder="${v.folder}">
          <div class="version-item-label">${v.label}${v.isCurrent ? ' <span class="version-badge">current</span>' : ''}</div>
          <div class="version-item-folder">${v.folder}</div>
          <div class="version-item-actions">
            <button class="version-btn-preview" data-folder="${v.folder}">👁 Preview</button>
            ${!v.isCurrent ? `<button class="version-btn-apply" data-folder="${v.folder}">✅ Apply</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
  document.body.appendChild(versionPanel);

  versionPanel.querySelector('#version-panel-close')!.addEventListener('click', closeVersionPanel);

  versionPanel.querySelectorAll('.version-btn-preview').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folder = (e.currentTarget as HTMLElement).getAttribute('data-folder')!;
      previewVersion(folder);
    });
  });

  versionPanel.querySelectorAll('.version-btn-apply').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const folder = (e.currentTarget as HTMLElement).getAttribute('data-folder')!;
      applyVersion(folder);
    });
  });
}

function closeVersionPanel(): void {
  versionPanel?.remove();
  versionPanel = null;
}

// ── Domain rename ────────────────────────────────────────────────────────────

function openDomainPanel(): void {
  if (domainPanel) { closeDomainPanel(); return; }

  const currentDomain = window.location.hostname;
  if (!currentDomain.endsWith('.mutelai.com')) {
    showToast('⚠️ Domain rename is only available on mutelai.com subdomains');
    return;
  }

  const parts = currentDomain.split('.');
  const currentSlug = parts[0];
  const suffix = parts.slice(1).join('.');

  domainPanel = document.createElement('div');
  domainPanel.id = 'domain-panel';
  domainPanel.innerHTML = `
    <div class="domain-panel-header">
      <span>🌐 Rename Domain</span>
      <button id="domain-panel-close">✕</button>
    </div>
    <div class="domain-panel-body">
      <p class="domain-current">Current: <strong>${currentDomain}</strong></p>
      <div class="domain-input-row">
        <input id="domain-new-slug" type="text" placeholder="${currentSlug}" value="${currentSlug}" autocomplete="off" spellcheck="false" />
        <span class="domain-suffix">.${suffix}</span>
      </div>
      <div id="domain-status" class="domain-status"></div>
      <button id="domain-btn-check" class="domain-action-btn">🔍 Check availability</button>
      <button id="domain-btn-rename" class="domain-action-btn domain-btn-rename" disabled>✅ Rename Domain</button>
    </div>
  `;
  document.body.appendChild(domainPanel);

  domainPanel.querySelector('#domain-panel-close')!.addEventListener('click', closeDomainPanel);

  const input    = domainPanel.querySelector<HTMLInputElement>('#domain-new-slug')!;
  const checkBtn = domainPanel.querySelector<HTMLButtonElement>('#domain-btn-check')!;
  const renameBtn = domainPanel.querySelector<HTMLButtonElement>('#domain-btn-rename')!;
  let checkedSlug = '';

  input.addEventListener('input', () => {
    renameBtn.disabled = true;
    checkedSlug = '';
    setDomainStatus('', '');
  });

  checkBtn.addEventListener('click', async () => {
    const newSlug = input.value.trim().toLowerCase();
    if (!newSlug || newSlug === currentSlug) {
      setDomainStatus('error', '⚠️ Please enter a different subdomain');
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(newSlug)) {
      setDomainStatus('error', '⚠️ Invalid subdomain — letters, numbers and hyphens only');
      return;
    }

    checkBtn.disabled = true;
    checkBtn.textContent = '⏳ Checking…';
    setDomainStatus('', '');

    try {
      const res = await fetch('/api/rename-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: activeToken, newSlug, checkOnly: true }),
      });
      const data = await res.json();
      if (data.available) {
        setDomainStatus('ok', `✅ "${newSlug}.${suffix}" is available!`);
        checkedSlug = newSlug;
        renameBtn.disabled = false;
      } else {
        setDomainStatus('error', `❌ "${newSlug}.${suffix}" is already taken`);
        renameBtn.disabled = true;
      }
    } catch {
      setDomainStatus('error', '⚠️ Could not check availability');
    } finally {
      checkBtn.disabled = false;
      checkBtn.textContent = '🔍 Check availability';
    }
  });

  renameBtn.addEventListener('click', async () => {
    if (!checkedSlug) return;
    if (!confirm(`Rename domain to "${checkedSlug}.${suffix}"?\n\nThe site will briefly be unavailable during the transition.`)) return;

    renameBtn.disabled = true;
    renameBtn.textContent = '⏳ Renaming…';

    try {
      const res = await fetch('/api/rename-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: activeToken, newSlug: checkedSlug }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        closeDomainPanel();
        showToast(`✅ Domain renamed to ${data.newDomain} — redirecting in 3s…`);
        setTimeout(() => { window.location.href = `https://${data.newDomain}`; }, 3000);
      } else {
        setDomainStatus('error', `❌ ${data.error || 'Rename failed'}`);
        renameBtn.disabled = false;
        renameBtn.textContent = '✅ Rename Domain';
      }
    } catch (err: any) {
      setDomainStatus('error', `❌ ${err.message}`);
      renameBtn.disabled = false;
      renameBtn.textContent = '✅ Rename Domain';
    }
  });

  input.focus();
  input.select();
}

function setDomainStatus(type: string, message: string): void {
  const el = domainPanel?.querySelector<HTMLElement>('#domain-status');
  if (!el) return;
  el.textContent = message;
  el.className = `domain-status${type ? ` domain-status-${type}` : ''}`;
}

function closeDomainPanel(): void {
  domainPanel?.remove();
  domainPanel = null;
}

async function loadVersionData(folder: string): Promise<BusinessJson | null> {
  try {
    const res = await fetch(`/api/version-data?folder=${encodeURIComponent(folder)}`);
    if (!res.ok) throw new Error('Failed to load version');
    return await res.json();
  } catch {
    showToast('⚠️ Could not load version data');
    return null;
  }
}

async function previewVersion(folder: string): Promise<void> {
  const data = await loadVersionData(folder);
  if (!data) return;

  const info = versionsList.find(v => v.folder === folder);
  previewingVersion = info ?? null;

  mutatedData = structuredClone(data);

  markDirtyWithLabel(`👁 Previewing ${info?.label ?? folder}`);
  showToast(`👁 Loaded ${info?.label ?? folder} — click Save to persist, or Apply for full reload`);
}

async function applyVersion(folder: string): Promise<void> {
  if (isDirty && previewingVersion?.folder !== folder) {
    if (!confirm('You have unsaved changes. Apply this version anyway?')) return;
  }

  const data = await loadVersionData(folder);
  if (!data) return;

  const json = JSON.stringify({ ...data, editToken: activeToken }, null, 2);
  const info = versionsList.find(v => v.folder === folder);
  const applyBtn = versionPanel?.querySelector<HTMLButtonElement>(`.version-btn-apply[data-folder="${folder}"]`);
  if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = '⏳ Saving…'; }

  try {
    const res = await fetch('/api/save-business', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    });
    if (res.ok) {
      const resData = await res.json();
      const hash = resData.hash ?? resData.git?.hash ?? '';
      showToast(`✅ ${info?.label ?? folder} applied — site will update in ~1 min${hash ? ` (${hash})` : ''}`);
      setTimeout(() => location.reload(), 800);
    } else {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${res.status}`);
    }
  } catch (err: any) {
    if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = '✅ Apply'; }
    showToast(`❌ Error: ${err.message}`);
  }
}

let isDirty = false;
function markDirty(): void {
  isDirty = true;
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = '✏️ Unsaved changes';
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLElement | null;
  if (saveBtn) saveBtn.style.background = '#22c55e';
}

function markDirtyWithLabel(text: string): void {
  isDirty = true;
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = text;
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLElement | null;
  if (saveBtn) saveBtn.style.background = '#22c55e';
}

// ── Save ─────────────────────────────────────────────────────────────────────

function save(): void {
  const json = JSON.stringify({ ...mutatedData, editToken: activeToken }, null, 2);

  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLButtonElement | null;
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…'; }

  fetch('/api/save-business', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: json,
  })
    .then(async res => {
      if (res.ok) return res.json();
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Server error ${res.status}`);
    })
    .then((data: any) => {
      isDirty = false;
      resetToolbar();
      if (data.git?.committed || data.committed) {
        showToast(`✅ Saved! Site will update in ~1 min (${data.hash ?? data.git?.hash ?? ''})`);
      } else {
        showToast('✅ Saved successfully!');
      }
    })
    .catch((err: Error) => {
      resetToolbar();
      showToast(`❌ Save error: ${err.message} — downloading JSON as backup`);
      downloadJson(json);
      isDirty = false;
    });
}

function downloadJson(json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'business.json';
  a.click();
  URL.revokeObjectURL(url);
}

function resetToolbar(): void {
  const label = toolbar?.querySelector('.edit-toolbar-label');
  if (label) label.textContent = '✏️ Edit Mode';
  const saveBtn = toolbar?.querySelector('#edit-btn-save') as HTMLButtonElement | null;
  if (saveBtn) { saveBtn.style.background = ''; saveBtn.disabled = false; saveBtn.textContent = '💾 Save'; }
}

// ── Deploy ───────────────────────────────────────────────────────────────────

async function triggerDeploy(): Promise<void> {
  const deployBtn = toolbar?.querySelector<HTMLButtonElement>('#edit-btn-deploy');
  if (deployBtn) { deployBtn.disabled = true; deployBtn.textContent = '⏳ Deploying…'; }

  try {
    const res = await fetch('/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editToken: activeToken }),
    });
    if (res.ok) {
      showToast('🚀 Deploy triggered — site will update in ~1 min');
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(`❌ Deploy failed: ${err.error || `Server error ${res.status}`}`);
    }
  } catch (err: any) {
    showToast(`❌ Deploy failed: ${err.message}`);
  } finally {
    if (deployBtn) { deployBtn.disabled = false; deployBtn.textContent = '🚀 Deploy'; }
  }
}

// ── Cancel ───────────────────────────────────────────────────────────────────

function cancel(): void {
  if (isDirty && !confirm('You have unsaved changes. Exit?')) return;
  observer?.disconnect();
  observer = null;
  document.body.classList.remove('edit-mode-active');
  editStyleEl?.remove();
  toolbar?.remove();

  document.querySelectorAll('.edit-hoverable').forEach(el => {
    (el as HTMLElement).contentEditable = 'false';
    el.classList.remove('edit-hoverable', 'edit-active');
    (el as HTMLElement).removeAttribute('title');
    (el as HTMLElement).removeAttribute('data-edit-original');
  });
  document.querySelectorAll('.edit-delete-btn').forEach(el => el.remove());
  document.querySelectorAll('.edit-section-delete-btn').forEach(el => el.remove());
  document.querySelectorAll('.edit-hide-btn').forEach(el => el.remove());
  document.querySelectorAll('.edit-section-deletable').forEach(el => el.classList.remove('edit-section-deletable'));
  document.querySelectorAll('.edit-img-overlay').forEach(el => el.remove());
  document.querySelectorAll('.edit-img-wrap').forEach(el => el.classList.remove('edit-img-wrap'));
  document.querySelectorAll('[data-edit-ui]').forEach(el => el.remove());
  closeVersionPanel();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(Number(parts[i])) ? parts[i] : Number(parts[i]);
    if (current[key] == null) return;
    current = current[key];
  }
  const lastKey = parts[parts.length - 1];
  current[isNaN(Number(lastKey)) ? lastKey : Number(lastKey)] = value;
}

function showToast(message: string): void {
  const existing = document.querySelector('.edit-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'edit-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('edit-toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Injected styles ──────────────────────────────────────────────────────────

function injectStyles(): void {
  editStyleEl = document.createElement('style');
  editStyleEl.textContent = `
    /* ── Editable text ── */
    .edit-hoverable {
      cursor: pointer !important;
      position: relative;
      border-radius: 4px;
      transition: outline 0.15s, background 0.15s;
      outline: 2px dashed transparent;
      outline-offset: 3px;
    }
    .edit-hoverable:hover {
      outline: 2px dashed #eab308;
      background: rgba(234, 179, 8, 0.07);
    }
    .edit-active {
      outline: 2px solid #eab308 !important;
      outline-offset: 3px;
      background: rgba(234, 179, 8, 0.1) !important;
      cursor: text !important;
    }

    /* ── Image edit overlay ── */
    .edit-img-wrap { cursor: pointer; }
    .edit-img-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 1rem;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: auto;
      cursor: pointer;
      border-radius: inherit;
      z-index: 10;
    }
    .edit-img-wrap:hover .edit-img-overlay {
      opacity: 1;
    }
    .edit-logo-overlay {
      font-size: 0.65rem;
      padding: 2px 4px;
      border-radius: 6px;
      white-space: nowrap;
    }

    /* ── Delete button ── */
    .edit-delete-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      z-index: 20;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239,68,68,0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }
    *:hover > .edit-delete-btn { opacity: 1; }

    /* ── Section delete button ── */
    .edit-section-deletable { position: relative; }
    .edit-section-delete-btn {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 30;
      padding: 6px 16px;
      background: rgba(239,68,68,0.85);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .edit-section-deletable:hover .edit-section-delete-btn { opacity: 1; }

    /* ── Hide element button ── */
    .edit-hide-btn {
      position: absolute;
      top: -8px;
      right: -8px;
      z-index: 30;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(239,68,68,0.9);
      color: white;
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    *:hover > .edit-hide-btn { opacity: 1; }

    /* ── Add photo card ── */
    .edit-add-photo-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 3px dashed rgba(59,130,246,0.4);
      border-radius: 12px;
      background: rgba(59,130,246,0.05);
      color: #3b82f6;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      min-height: 8rem;
    }
    .edit-add-photo-btn:hover {
      border-color: rgba(59,130,246,0.7);
      background: rgba(59,130,246,0.1);
    }

    /* ── Toolbar ── */
    #edit-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #1e293b;
      color: white;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }
    .edit-toolbar-label {
      flex: 1;
      font-weight: 600;
    }
    #edit-toolbar button {
      padding: 6px 14px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      color: white;
      background: #475569;
    }
    #edit-toolbar button:hover { background: #64748b; }
    #edit-toolbar button:disabled { opacity: 0.5; cursor: default; }
    #edit-btn-cancel { background: #dc2626; }
    #edit-btn-cancel:hover { background: #ef4444; }

    /* ── Toast ── */
    .edit-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10001;
      padding: 12px 24px;
      background: #1e293b;
      color: white;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      transition: opacity 0.3s;
      max-width: 90vw;
      text-align: center;
    }
    .edit-toast-hide { opacity: 0; }

    /* ── Version panel ── */
    #version-panel {
      position: fixed;
      top: 48px;
      right: 12px;
      z-index: 9998;
      width: 340px;
      max-height: 70vh;
      overflow-y: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
      font-family: system-ui, sans-serif;
    }
    .version-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 700;
      font-size: 14px;
    }
    .version-panel-header button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #9ca3af;
    }
    .version-panel-list { padding: 8px; }
    .version-item {
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 4px;
      transition: background 0.15s;
    }
    .version-item:hover { background: #f9fafb; }
    .version-current { background: #eff6ff; }
    .version-item-label { font-weight: 600; font-size: 13px; color: #1f2937; }
    .version-item-folder { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .version-item-actions { display: flex; gap: 6px; margin-top: 8px; }
    .version-btn-preview,
    .version-btn-apply {
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .version-btn-preview:hover { background: #f3f4f6; }
    .version-btn-apply { background: #3b82f6; color: white; border-color: transparent; }
    .version-btn-apply:hover { background: #2563eb; }
    .version-badge {
      display: inline-block;
      padding: 1px 6px;
      background: #3b82f6;
      color: white;
      border-radius: 4px;
      font-size: 10px;
      margin-left: 6px;
    }

    /* ── Domain panel ── */
    #domain-panel {
      position: fixed;
      top: 48px;
      right: 12px;
      z-index: 9998;
      width: 320px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.2);
      font-family: system-ui, sans-serif;
      overflow: hidden;
    }
    .domain-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 700;
      font-size: 14px;
      color: #1f2937;
    }
    .domain-panel-header button {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #9ca3af;
    }
    .domain-panel-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .domain-current {
      margin: 0;
      font-size: 13px;
      color: #374151;
    }
    .domain-input-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .domain-input-row input {
      flex: 1;
      min-width: 0;
      padding: 7px 10px;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: monospace;
      outline: none;
      transition: border-color 0.15s;
    }
    .domain-input-row input:focus { border-color: #3b82f6; }
    .domain-suffix {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      font-family: monospace;
    }
    .domain-status {
      min-height: 18px;
      font-size: 13px;
      font-weight: 500;
    }
    .domain-status-ok    { color: #16a34a; }
    .domain-status-error { color: #dc2626; }
    .domain-action-btn {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      background: #f1f5f9;
      color: #1e293b;
      transition: background 0.15s;
    }
    .domain-action-btn:hover:not(:disabled) { background: #e2e8f0; }
    .domain-action-btn:disabled { opacity: 0.45; cursor: default; }
    .domain-btn-rename { background: #3b82f6; color: white; }
    .domain-btn-rename:hover:not(:disabled) { background: #2563eb; }

    /* ── Push main content down when toolbar is visible ── */
    body.edit-mode-active {
      padding-top: 48px !important;
    }
    body.edit-mode-active header.fixed {
      top: 48px !important;
    }
  `;
  document.head.appendChild(editStyleEl);
}
