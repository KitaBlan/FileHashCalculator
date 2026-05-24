/**
 * 应用入口 / Application Entry Point
 * @module main
 */
import './styles/main.css';
import { AppState } from './state/store.ts';
import { I18n } from './i18n/index.ts';
import { SettingsManager } from './utils/storage.ts';
import { createIcons, icons } from 'lucide';
import { renderApp, renderProgressContent, renderResultsList, renderMultiFileComparison, renderCompareMatch, renderCompareMismatch, renderCompareInvalid, renderCompareNoCalc, renderToast, renderSettingsModal, renderExportModal } from './ui/render.ts';

document.addEventListener('DOMContentLoaded', () => {
  SettingsManager.init();
  I18n.init(SettingsManager.get('language'));
  const app = document.getElementById('app')!;
  app.innerHTML = renderApp();
  createIcons({ icons });
  const savedTheme = SettingsManager.get('theme');
  applyTheme(savedTheme || 'system');
  bindEvents();
});

/** 应用主题 / Apply theme */
export function applyTheme(theme: string) {
  const isDark = theme === 'dark' || (theme === 'system' && globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  AppState.set('theme', theme);
  const sun = document.getElementById('icon-sun'), moon = document.getElementById('icon-moon');
  if (sun && moon) { sun.style.display = isDark ? 'none' : ''; moon.style.display = isDark ? '' : 'none'; }
}

// ========== 工具函数 / Utilities ==========
function esc(str: string): string { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function fmtSize(bytes: number): string { if (bytes === 0) return '0 Bytes'; const k = 1024; const s = ['Bytes','KB','MB','GB','TB']; const i = Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+s[i]; }

// ========== 状态 / State ==========
let selectedFiles: File[] = [];
let selectedAlgos = new Set<string>();
let calcAbortController: AbortController | null = null;
let hmacMode = false;

function toggleHmac() {
  hmacMode = !hmacMode;
  const b = document.getElementById('hmac-toggle')!;
  b.textContent = hmacMode ? 'HMAC: ON' : 'HMAC: OFF';
  b.style.borderColor = hmacMode ? 'var(--accent)' : 'var(--border)';
  b.style.color = hmacMode ? 'var(--accent)' : 'var(--text-secondary)';
  document.getElementById('hmac-key-container')?.classList.toggle('hidden', !hmacMode);
}

// ========== 事件绑定 / Event bindings ==========

function bindPersistentEvents() {
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const dropArea = document.getElementById('drop-area')!;

  dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('dropzone-active'); });
  dropArea.addEventListener('dragleave', e => { e.preventDefault(); if (!dropArea.contains(e.relatedTarget as Node)) dropArea.classList.remove('dropzone-active'); });
  dropArea.addEventListener('drop', e => { e.preventDefault(); dropArea.classList.remove('dropzone-active'); if (e.dataTransfer?.files.length) addFiles(Array.from(e.dataTransfer.files)); });
  dropArea.addEventListener('click', e => { if (!(e.target as HTMLElement).closest('label')) fileInput.click(); });
  fileInput.addEventListener('change', () => { if (fileInput.files?.length) addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

  document.addEventListener('keydown', e => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag==='INPUT'||tag==='TEXTAREA') { if (e.key==='Escape') (e.target as HTMLElement).blur(); return; }
    if ((e.ctrlKey||e.metaKey)&&e.key==='Enter') { e.preventDefault(); startCalculation(); }
    if ((e.ctrlKey||e.metaKey)&&e.key==='o') { e.preventDefault(); fileInput.click(); }
    if ((e.ctrlKey||e.metaKey)&&e.key==='d') { e.preventDefault(); document.getElementById('theme-toggle')?.click(); }
  });

  document.addEventListener('click', e => {
    if ((e.target as HTMLElement).id === 'cancel-btn' || (e.target as HTMLElement).closest('#cancel-btn')) calcAbortController?.abort();
    const btn = (e.target as HTMLElement).closest('.tutorial-start');
    if (btn) startTutorial((btn as HTMLElement).dataset.tutorial!);
  });
}

function bindDynamicEvents() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = SettingsManager.get('theme');
    const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    SettingsManager.set('theme', next); SettingsManager.save(); applyTheme(next);
  });

  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    switchLanguage(I18n.currentLang === 'zh' ? 'en' : 'zh');
  });

  document.getElementById('settings-btn')?.addEventListener('click', openSettingsModal);
  document.getElementById('text-toggle')?.addEventListener('click', () => { document.getElementById('text-content')?.classList.toggle('hidden'); document.getElementById('text-chevron')?.classList.toggle('rotate-180'); });
  document.getElementById('text-hash-btn')?.addEventListener('click', handleTextHash);
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', e => { e.preventDefault(); const s = (link as HTMLElement).dataset.section; if (s) switchPage(s); }));
  document.getElementById('calculate-btn')?.addEventListener('click', startCalculation);
  document.getElementById('clear-btn')?.addEventListener('click', clearFiles);
  document.getElementById('compare-btn')?.addEventListener('click', compareHash);
  document.getElementById('hmac-toggle')?.addEventListener('click', toggleHmac);

  document.getElementById('algo-search')?.addEventListener('input', e => {
    const q = (e.target as HTMLInputElement).value.toLowerCase().trim();
    document.querySelectorAll('.algo-card').forEach(card => {
      const n = (card as HTMLElement).dataset.algo || '';
      const t = (card as HTMLElement).dataset.tooltip || '';
      const d = I18n.t('algo.'+n+'.desc').toLowerCase();
      (card as HTMLElement).style.display = (!q || n.includes(q) || t.includes(q) || d.includes(q)) ? '' : 'none';
    });
  });

  document.querySelectorAll('.algo-card').forEach(card => card.addEventListener('click', () => toggleAlgo((card as HTMLElement).dataset.algo!)));
  document.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', () => applyPreset((btn as HTMLElement).dataset.preset!)));
  document.querySelectorAll('[data-select-all]').forEach(btn => btn.addEventListener('click', () => selectAllGroup((btn as HTMLElement).dataset.selectAll!)));
  document.querySelectorAll('[data-toggle]').forEach(hdr => hdr.addEventListener('click', () => {
    const k = (hdr as HTMLElement).dataset.toggle!;
    const c = document.querySelector('[data-group-content="'+k+'"]');
    const i = hdr.querySelector('i[data-lucide]');
    if (c) { c.classList.toggle('hidden'); i?.setAttribute('data-lucide', c.classList.contains('hidden') ? 'chevron-right' : 'chevron-down'); createIcons({ icons }); }
  }));

  document.getElementById('compare-hash-input')?.addEventListener('input', e => {
    const v = (e.target as HTMLInputElement).value.trim();
    const d = document.getElementById('hash-detected');
    if (v.length >= 8 && /^[0-9a-fA-F]+$/.test(v)) {
      const len = v.length;
      const candidates: Record<number,string> = {8:'CRC32',16:'xxHash64',32:'MD5 / CRC32',40:'SHA-1 / RIPEMD-160',64:'SHA-256 / SHA3-256 / BLAKE2b / BLAKE3 / SM3',96:'SHA-384 / SHA3-384',128:'SHA-512 / SHA3-512 / BLAKE2b-512 / Whirlpool'};
      const p = candidates[len] || '';
      if (p && d) { document.getElementById('hash-detected-text')!.textContent = I18n.t('compare.detected',{algo:p}); d.classList.remove('hidden'); d.classList.add('flex'); }
      else { d?.classList.add('hidden'); d?.classList.remove('flex'); }
    } else { d?.classList.add('hidden'); d?.classList.remove('flex'); }
  });
  document.getElementById('compare-hash-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') compareHash(); });
}

function bindEvents() {
  bindPersistentEvents();
  bindDynamicEvents();
}

function switchLanguage(lang: string) {
  I18n.setLang(lang);
  SettingsManager.set('language', lang);
  SettingsManager.save();
  const app = document.getElementById('app')!;
  app.innerHTML = renderApp();
  createIcons({ icons });
  bindDynamicEvents();
  updateAlgoUI();
  applyTheme(SettingsManager.get('theme') || 'system');
}

// ========== 算法选择 / Algorithm selection ==========
function toggleAlgo(name: string) { if (selectedAlgos.has(name)) selectedAlgos.delete(name); else selectedAlgos.add(name); updateAlgoUI(); AppState.set('algorithms', [...selectedAlgos]); }
export function updateAlgoUI() {
  document.querySelectorAll('.algo-card').forEach(card => {
    const name = (card as HTMLElement).dataset.algo!;
    const sel = selectedAlgos.has(name);
    card.classList.toggle('algo-selected', sel);
    (card as HTMLElement).style.borderColor = sel ? 'var(--accent)' : 'var(--border)';
    (card as HTMLElement).style.background = sel ? 'var(--accent-subtle)' : '';
  });
  const c = selectedAlgos.size;
  document.getElementById('algo-count')!.textContent = c+' '+I18n.t('algorithm.selected');
  document.getElementById('algo-status')!.textContent = c+' '+I18n.t('algorithm.selected');
}

function applyPreset(preset: string) {
  const presets: Record<string,string[]> = { fileCheck:['sha256','md5'], secure:['sha256','sha512','blake3'], fast:['crc32','xxhash64'], smCompliance:['sm3','sha256'], all:['md5','sha1','sha256','sha384','sha512','sha3_256','sha3_384','sha3_512','blake2b_256','blake2b_512','blake2s_256','blake3','ripemd160','sm3','whirlpool','crc32','crc32c','adler32','xxhash64','xxhash3'] };
  selectedAlgos.clear(); (presets[preset]||[]).forEach(a => selectedAlgos.add(a)); updateAlgoUI();
  document.querySelectorAll('.preset-btn').forEach(btn => {
    const isActive = (btn as HTMLElement).dataset.preset === preset;
    (btn as HTMLElement).style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
    (btn as HTMLElement).style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
  });
}

function selectAllGroup(group: string) {
  const cards = document.querySelectorAll('[data-group-content="'+group+'"] [data-algo]');
  const names = [...cards].map(c => (c as HTMLElement).dataset.algo!);
  const allSel = names.every(n => selectedAlgos.has(n));
  names.forEach(n => allSel ? selectedAlgos.delete(n) : selectedAlgos.add(n));
  updateAlgoUI();
}

// ========== 文件处理 / File handling ==========
function addFiles(files: File[]) {
  selectedFiles.push(...files);
  renderFileList();
  (document.getElementById('calculate-btn') as HTMLButtonElement).disabled = false;
  import('./core/engine.ts').then(({ getOptimalChunkInfo }) => {
    const chunkMode = SettingsManager.get('chunkMode') || 'auto';
    const info = getOptimalChunkInfo(selectedFiles[selectedFiles.length - 1]?.size || 0, selectedAlgos.size);
    const ci = document.getElementById('chunk-info');
    if (ci) {
      if (chunkMode === 'auto') {
        ci.textContent = '📦 ' + info.label + ' · ' + (info.deviceMem || 4) + 'GB';
        ci.title = info.detail + ' | 可在设置中手动调整分块大小';
      } else {
        ci.textContent = '📦 ' + chunkMode.toUpperCase() + ' (手动)';
        ci.title = '手动设定，点击设置可改为自动推荐';
      }
      ci.style.cursor = 'help';
    }
  }).catch(() => {});
}
function renderFileList() {
  const lc = document.getElementById('file-list')!;
  const le = document.getElementById('selected-files')!;
  lc.classList.toggle('hidden', selectedFiles.length === 0);
  le.innerHTML = selectedFiles.map(f => '<li class="flex items-center justify-between py-1 px-2 rounded text-sm" style="color:var(--text-primary)"><span class="truncate max-w-[200px] sm:max-w-[300px] font-mono text-xs">'+esc(f.name)+'</span><span class="text-xs whitespace-nowrap" style="color:var(--text-secondary)">'+fmtSize(f.size)+'</span></li>').join('');
}
function clearFiles() { selectedFiles = []; renderFileList(); (document.getElementById('calculate-btn') as HTMLButtonElement).disabled = true; document.getElementById('results-area')!.classList.add('hidden'); document.getElementById('results-area')!.innerHTML = ''; document.getElementById('comparison-result')!.classList.add('hidden'); AppState.set('results', []); }

// ========== 计算 / Calculation ==========
/** 收集 HMAC 算法变体 / Collect HMAC variants */
function getHmacAlgos(baseAlgos: string[]): string[] {
  const noHmac = new Set(['crc32','crc32c','adler32','xxhash64','xxhash3']);
  return baseAlgos.filter(a => !noHmac.has(a)).map(a => 'hmac-'+a);
}

async function handleTextHash() {
  const text = (document.getElementById('text-input-area') as HTMLTextAreaElement)?.value;
  if (!text) return;
  const algos = [...selectedAlgos];
  if (algos.length === 0) { showToast(I18n.t('toast.selectAlgo'), I18n.t('toast.selectAlgoMsg'), 'warning'); return; }
  // HMAC 支持 / HMAC support
  if (hmacMode) {
    const key = (document.getElementById('hmac-key') as HTMLInputElement)?.value?.trim();
    if (!key) { showToast(I18n.t('toast.hmacKey'), I18n.t('toast.hmacKeyMsg'), 'warning'); return; }
    algos.push(...getHmacAlgos(algos));
  }
  const { Engine } = await import('./core/engine.ts');
  const file = new File([new TextEncoder().encode(text)], 'text-input.txt', { type: 'text/plain' });
  const result = await Engine.calculateMultipleHashes(file, algos, {});
  showResults([result]);
}

async function startCalculation() {
  const algos = [...selectedAlgos];
  const hmacKeyEl = document.getElementById('hmac-key') as HTMLInputElement;
  const hmacKey = hmacKeyEl?.value?.trim() || null;
  if (hmacMode) {
    if (!hmacKey) { showToast(I18n.t('toast.hmacKey'), I18n.t('toast.hmacKeyMsg'), 'warning'); return; }
    algos.push(...getHmacAlgos(algos));
  }
  if (algos.length === 0) { showToast(I18n.t('toast.selectAlgo'), I18n.t('toast.selectAlgoMsg'), 'warning'); return; }
  if (selectedFiles.length === 0) { showToast(I18n.t('toast.selectFile'), I18n.t('toast.selectFileMsg'), 'warning'); return; }

  const chunkMode = SettingsManager.get('chunkMode') || 'auto';
  const chunkMap: Record<string,number> = { '32k':32768, '64k':65536, '256k':262144, '512k':524288, '1m':1048576, '2m':2097152, '4m':4194304 };
  const chunkSizeOverride = chunkMode !== 'auto' ? (chunkMap[chunkMode] || 0) : 0;

  AppState.set('chunkMode', chunkMode);
  AppState.set('calcStartTime', Date.now());
  calcAbortController = new AbortController();
  (document.getElementById('calculate-btn') as HTMLButtonElement).disabled = true;
  document.getElementById('cancel-btn')!.classList.remove('hidden');
  document.getElementById('progress-area')!.classList.remove('hidden');
  const allResults: any[] = [];
  try {
    const { Engine } = await import('./core/engine.ts');
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]; updateProgress(file.name, 0, i, selectedFiles.length);
      const result = await Engine.calculateMultipleHashes(file, algos, {
        signal: calcAbortController.signal,
        chunkSizeOverride: chunkSizeOverride || undefined,
        onProgress: (p: any) => updateProgress(file.name, p.percentage, i, selectedFiles.length),
      });
      AppState.set('chunkLabel', (result as any).chunkLabel || '');
      allResults.push(result);
    }
    AppState.set('results', allResults); showResults(allResults);
    showToast(I18n.t('toast.calcComplete'), I18n.t('toast.calcCompleteMsg', { count: selectedFiles.length.toString() }), 'success');
    try { const { DB } = await import('./utils/db.ts'); for (const r of allResults) await DB.add({ filename: r.filename, size: r.size, hashValues: r.hashValues, duration: r.duration, timestamp: Date.now() }); } catch (e) { console.warn('Failed to save history:', e); }
  } catch (e: any) {
    if (e.name === 'AbortError') showToast(I18n.t('toast.calcCancelled'), '', 'info');
    else showToast(I18n.t('toast.calcFailed'), I18n.t('toast.calcFailedMsg', { error: e.message }), 'error');
  } finally {
    (document.getElementById('calculate-btn') as HTMLButtonElement).disabled = false;
    document.getElementById('cancel-btn')!.classList.add('hidden');
    document.getElementById('progress-area')!.classList.add('hidden');
    calcAbortController = null;
  }
}

function updateProgress(filename: string, pct: number, idx: number, total: number) {
  const area = document.getElementById('progress-area')!;
  const startTime = AppState.get('calcStartTime') || Date.now();
  const elapsed = Date.now() - startTime;
  const remaining = pct > 0 ? Math.max(0, (elapsed / pct) * (100 - pct)) : 0;
  const rs = remaining < 1000 ? I18n.t('progress.almostDone') : remaining < 60000 ? Math.ceil(remaining / 1000)+'s' : Math.floor(remaining / 60000)+'m '+Math.ceil((remaining % 60000) / 1000)+'s';
  area.innerHTML = renderProgressContent(filename, pct, idx, total, rs, AppState.get('chunkLabel') || '', AppState.get('chunkMode') || 'auto');
}

function showResults(results: any[]) {
  const area = document.getElementById('results-area')!; area.classList.remove('hidden');
  area.innerHTML = renderResultsList(results);
  createIcons({ icons });
  area.querySelectorAll('.copy-hash-btn').forEach(btn => btn.addEventListener('click', async () => { const hash = (btn as HTMLElement).dataset.hash!; await navigator.clipboard.writeText(hash).catch(() => {}); showToast(I18n.t('toast.copySuccess'), I18n.t('toast.copySuccessMsg', { algo: (btn as HTMLElement).dataset.algo!.toUpperCase() }), 'success', 2000); }));
  document.getElementById('copy-all-btn')?.addEventListener('click', async () => { const text = results.map(r => Object.entries(r.hashValues).map(([a,h]) => a.toUpperCase()+': '+h).join('\n')).join('\n\n'); await navigator.clipboard.writeText(text).catch(() => {}); showToast(I18n.t('toast.copyAllSuccess'), I18n.t('toast.copyAllSuccessMsg'), 'success'); });
  document.getElementById('export-btn')?.addEventListener('click', () => openExportModal(results));
  if (results.length > 1) showMultiFileComparison(results);
}

function showMultiFileComparison(results: any[]) {
  const algos = new Set<string>(); results.forEach(r => Object.keys(r.hashValues).forEach(a => algos.add(a)));
  const comparisons: Array<{algo:string; allMatch:boolean; groups?:Record<string,string[]>}> = [];
  for (const algo of algos) {
    const groups: Record<string,string[]> = {};
    results.forEach(r => { const h = r.hashValues[algo]; if (!groups[h]) groups[h] = []; groups[h].push(r.filename); });
    comparisons.push({ algo, allMatch: Object.keys(groups).length === 1, groups: Object.keys(groups).length === 1 ? undefined : groups });
  }
  const area = document.getElementById('results-area')!;
  const existing = document.getElementById('multi-file-result');
  if (existing) existing.remove();
  const div = document.createElement('div'); div.id = 'multi-file-result'; div.className = 'mt-4';
  div.innerHTML = '<h3 class="text-md font-semibold mb-3 flex items-center gap-2"><i data-lucide="git-compare" class="w-4 h-4" style="color:var(--accent)"></i>'+I18n.t('compare.multiFile')+'</h3>'+renderMultiFileComparison(comparisons);
  area.appendChild(div); createIcons({ icons });
}

function compareHash() {
  const input = (document.getElementById('compare-hash-input') as HTMLInputElement)?.value?.trim();
  const re = document.getElementById('comparison-result')!;
  if (!input) { showToast(I18n.t('toast.selectAlgo'), I18n.t('compare.noComparison'), 'warning'); return; }
  if (!/^[0-9a-fA-F]+$/.test(input)) { re.innerHTML = renderCompareInvalid(); re.classList.remove('hidden'); return; }
  const results = AppState.get('results') || [];
  if (results.length === 0) { re.innerHTML = renderCompareNoCalc(); re.classList.remove('hidden'); return; }
  const matches: Array<{filename:string;algo:string}> = [];
  results.forEach((r:any) => { Object.entries(r.hashValues).forEach(([algo,hash]) => { if (input.toLowerCase() === (hash as string).toLowerCase()) matches.push({ filename: r.filename, algo }); }); });
  re.classList.remove('hidden');
  re.innerHTML = matches.length > 0 ? renderCompareMatch(matches) : renderCompareMismatch();
  createIcons({ icons });
}

function switchPage(page: string) { document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden')); document.getElementById('page-'+page)?.classList.remove('hidden'); document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active')); document.querySelector('.nav-link[data-section="'+page+'"]')?.classList.add('active'); AppState.set('currentPage', page); }

// ========== Toast ==========
function showToast(title: string, message: string, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container')!;
  const colors: Record<string,string> = { success:'var(--success)', info:'var(--accent)', warning:'var(--warning)', error:'var(--error)' };
  const color = colors[type] || 'var(--accent)';
  const el = document.createElement('div');
  el.className = 'toast-enter rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-sm';
  el.style.cssText = 'background:var(--bg-secondary);border-left:3px solid '+color;
  el.innerHTML = renderToast(title, message, type, duration);
  container.appendChild(el); createIcons({ icons });
  if (duration > 0) { requestAnimationFrame(() => requestAnimationFrame(() => { const p = el.querySelector('.toast-progress') as HTMLElement; if (p) p.style.width = '0%'; })); setTimeout(() => { el.classList.remove('toast-enter'); el.classList.add('toast-exit'); setTimeout(() => el.remove(), 200); }, duration); }
  el.querySelector('.toast-close')?.addEventListener('click', () => { el.classList.remove('toast-enter'); el.classList.add('toast-exit'); setTimeout(() => el.remove(), 200); });
}

// ========== 弹窗 / Modals ==========
function openSettingsModal() {
  const s = SettingsManager.getAll();
  const modal = document.createElement('div'); modal.id = 'settings-modal'; modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modal.style.cssText = 'background:oklch(0% 0 0 / 0.5);backdrop-filter:blur(4px)';
  modal.innerHTML = renderSettingsModal(s);
  document.body.appendChild(modal); createIcons({ icons });
  modal.querySelector('.close-settings')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelectorAll('.toggle-switch').forEach(btn => btn.addEventListener('click', () => { btn.classList.toggle('active'); btn.setAttribute('aria-checked', btn.classList.contains('active').toString()); }));
  modal.querySelector('.save-settings')?.addEventListener('click', () => {
    SettingsManager.set('autoCalculate', modal.querySelector('#setting-autoCalc')?.classList.contains('active')??false);
    SettingsManager.set('chunkMode', (modal.querySelector('#setting-chunkMode') as HTMLSelectElement)?.value??'auto');
    SettingsManager.set('resultFormat', (modal.querySelector('#setting-resultFormat') as HTMLSelectElement)?.value??'lowercase');
    SettingsManager.set('theme', (modal.querySelector('#setting-theme') as HTMLSelectElement)?.value??'system');
    SettingsManager.set('language', (modal.querySelector('#setting-language') as HTMLSelectElement)?.value??'auto');
    SettingsManager.set('exportFormat', (modal.querySelector('#setting-exportFormat') as HTMLSelectElement)?.value??'txt');
    SettingsManager.save(); modal.remove();
    showToast(I18n.t('toast.settingsSaved'), '', 'success', 2000);
    applyTheme(SettingsManager.get('theme'));
    const newLang = SettingsManager.get('language');
    if (newLang !== 'auto' && newLang !== I18n.currentLang) switchLanguage(newLang);
  });
  modal.querySelector('.reset-settings')?.addEventListener('click', () => { SettingsManager.reset(); modal.remove(); showToast(I18n.t('settings.resetDefaults'), '', 'success', 2000); applyTheme(SettingsManager.get('theme')); });
}

function openExportModal(results: any[]) {
  const now = new Date(); const defaultName = 'hash_results_'+now.toISOString().slice(0,10)+'_'+now.toTimeString().slice(0,8).replace(/:/g,'-');
  const modal = document.createElement('div'); modal.className = 'fixed inset-0 z-50 flex items-center justify-center';
  modal.style.cssText = 'background:oklch(0% 0 0 / 0.5);backdrop-filter:blur(4px)';
  modal.innerHTML = renderExportModal(defaultName);
  document.body.appendChild(modal); createIcons({ icons });
  const updatePreview = async () => { const fmt = (document.getElementById('export-format') as HTMLSelectElement)?.value||'txt'; const { exportAsTxt, exportAsCsv, exportAsJson } = await import('./utils/download.ts'); let content = ''; if (fmt==='csv') content = exportAsCsv(results); else if (fmt==='json') content = exportAsJson(results); else content = exportAsTxt(results, false); document.getElementById('export-preview')!.textContent = content.substring(0,500)+(content.length>500?'\n...':''); };
  updatePreview(); document.getElementById('export-format')?.addEventListener('change', updatePreview);
  modal.querySelectorAll('.close-export').forEach(btn => btn.addEventListener('click', () => modal.remove()));
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('.confirm-export')?.addEventListener('click', async () => {
    const filename = (document.getElementById('export-filename') as HTMLInputElement)?.value||'hash_results';
    const fmt = (document.getElementById('export-format') as HTMLSelectElement)?.value||'txt';
    const safeName = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_');
    const { exportAsTxt, exportAsCsv, exportAsJson, downloadFile } = await import('./utils/download.ts');
    let content='', mimeType='text/plain', ext='txt';
    if (fmt==='csv') { content=exportAsCsv(results); mimeType='text/csv'; ext='csv'; }
    else if (fmt==='json') { content=exportAsJson(results); mimeType='application/json'; ext='json'; }
    else { content=exportAsTxt(results); }
    downloadFile(content, safeName+'.'+ext, mimeType); modal.remove();
    showToast(I18n.t('toast.exportSuccess'), I18n.t('toast.exportSuccessMsg', { count: results.length.toString() }), 'success');
  });
}

// ========== 交互式教程 / Interactive Tutorial ==========
const TUTORIALS: Record<string, Array<{target:string; msg:string}>> = {
  firstHash: [
    { target: '#algorithm-picker', msg: '第一步：选择需要的哈希算法，或点击预设按钮快速选择' },
    { target: '#file-dropzone', msg: '第二步：拖拽文件到此处，或点击选择文件' },
    { target: '#calculate-btn', msg: '第三步：点击"开始计算"按钮' },
    { target: '#results-area', msg: '计算完成！这里展示结果，点击复制按钮可复制哈希值。' },
  ],
  verifyDownload: [
    { target: '#compare-area', msg: '第一步：在比较面板粘贴官方提供的哈希值' },
    { target: '#compare-hash-input', msg: '粘贴后系统自动识别算法类型' },
    { target: '#file-dropzone', msg: '第二步：选择你下载的文件' },
    { target: '#calculate-btn', msg: '第三步：计算后点击结果中的"校验"按钮比对' },
  ],
  multiFile: [
    { target: '#file-dropzone', msg: '第一步：选择 2 个或更多文件' },
    { target: '#calculate-btn', msg: '第二步：点击计算' },
    { target: '#results-area', msg: '系统会自动比较哈希值——相同哈希 = 完全相同内容' },
  ],
};
let _tut: {overlay:HTMLDivElement|null; step:number; id:string} = {overlay:null,step:0,id:''};

function startTutorial(id: string) {
  const steps = TUTORIALS[id]; if (!steps) return;
  _tut = {overlay:null,step:0,id};
  switchPage('calculate');
  setTimeout(() => showTutorialStep(), 400);
}

function showTutorialStep() {
  const steps = TUTORIALS[_tut.id]; if (!steps || _tut.step >= steps.length) { endTutorial(); return; }
  const step = steps[_tut.step];
  const target = document.querySelector(step.target);
  if (!target) { _tut.step++; showTutorialStep(); return; }
  target.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(() => {
    if (!_tut.overlay) { _tut.overlay = document.createElement('div'); _tut.overlay.className='fixed inset-0 z-[60]'; _tut.overlay.style.cssText='background:oklch(0% 0 0 / 0.4);backdrop-filter:blur(2px)'; document.body.appendChild(_tut.overlay); }
    const rect = target.getBoundingClientRect();
    _tut.overlay.innerHTML = '<div class="absolute pointer-events-none" style="top:'+(rect.top-4)+'px;left:'+(rect.left-4)+'px;width:'+(rect.width+8)+'px;height:'+(rect.height+8)+'px;border:2px solid var(--accent);border-radius:12px;box-shadow:0 0 0 9999px oklch(0% 0 0 / 0.4);z-index:61"></div><div class="absolute card max-w-sm pointer-events-auto" style="top:'+(rect.bottom+12)+'px;left:'+Math.max(16,rect.left)+'px;z-index:62"><p class="text-sm mb-4">'+step.msg+'</p><div class="flex items-center justify-between"><button class="tut-skip text-xs" style="color:var(--text-secondary)">跳过</button><div class="flex items-center gap-3"><span class="text-xs" style="color:var(--text-secondary)">'+(_tut.step+1)+'/'+steps.length+'</span><button class="tut-next btn-primary text-xs px-4 py-1.5">'+(_tut.step<steps.length-1?'下一步':'完成')+'</button></div></div></div>';
    _tut.overlay.classList.remove('hidden');
    _tut.overlay.querySelector('.tut-next')?.addEventListener('click', () => { _tut.step++; showTutorialStep(); });
    _tut.overlay.querySelector('.tut-skip')?.addEventListener('click', endTutorial);
    _tut.overlay.addEventListener('click', e => { if (e.target === _tut.overlay) endTutorial(); });
  }, 500);
}

function endTutorial() {
  _tut.overlay?.remove(); _tut.overlay = null; _tut.step = 0;
  showToast(I18n.t('tutorial.complete'), I18n.t('tutorial.completeMsg'), 'success')}
