/** UI 渲染函数 / UI Render Functions @module ui/render */
import {I18n} from '../i18n/index.ts';

// ========== 页面框架 / Page Layout ==========

export function renderApp(): string {
    return `<header class="sticky top-0 z-50 glass-effect border-b" style="border-color:var(--border)"><div class="container mx-auto px-4 py-3 flex justify-between items-center"><div class="flex items-center gap-2"><i data-lucide="hash" class="w-8 h-8" style="color:var(--accent)"></i><h1 class="text-xl font-bold" style="color:var(--accent)">${I18n.t('app.title')}</h1></div><nav class="hidden md:flex items-center gap-6"><a href="#" class="nav-link active flex items-center gap-1" data-section="calculate"><i data-lucide="calculator" class="w-5 h-5"></i><span>${I18n.t('nav.calculate')}</span></a><a href="#" class="nav-link flex items-center gap-1" data-section="help"><i data-lucide="help-circle" class="w-5 h-5"></i><span>${I18n.t('nav.help')}</span></a></nav><div class="flex items-center gap-2"><button id="lang-toggle" class="p-2 rounded-full text-sm font-medium" style="color:var(--text-secondary)">${I18n.currentLang === 'zh' ? 'EN' : '中'}</button><button id="settings-btn" class="p-2 rounded-full" style="color:var(--text-secondary)"><i data-lucide="settings" class="w-6 h-6"></i></button><button id="theme-toggle" class="p-2 rounded-full" style="color:var(--text-secondary)"><i data-lucide="sun" class="w-6 h-6" id="icon-sun"></i><i data-lucide="moon" class="w-6 h-6" id="icon-moon" style="display:none"></i></button></div></div></header>
<main class="container mx-auto px-4 py-8"><section id="page-calculate" class="page-section">${renderAlgorithmPicker()}${renderDropzone()}${renderCompareArea()}<div id="progress-area" class="mt-6 hidden"></div><div id="results-area" class="mt-6 hidden"></div></section><section id="page-help" class="page-section hidden">${renderHelpPage()}</section></main>
<footer class="border-t py-6 mt-8" style="border-color:var(--border);color:var(--text-secondary)"><div class="container mx-auto px-4 text-center text-sm"><p class="mb-2"><strong style="color:var(--accent)">${I18n.t('app.title')}</strong> — ${I18n.t('footer.desc')}</p><p class="mb-2">${I18n.t('footer.algos')}</p><p>${I18n.t('footer.privacy')}</p><div class="mt-3 flex items-center justify-center gap-4 text-xs"><span><a href="LICENSE" target="_blank" class="hover:underline" style="color:var(--accent)">${I18n.t('common.license')}</a></span><a href="https://github.com/KitaBlan/FileHashCalculator" target="_blank" rel="noopener noreferrer" class="hover:underline flex items-center gap-1" style="color:var(--accent)"><i data-lucide="github" class="w-3 h-3"></i>GitHub</a></div></div></footer><div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col gap-2"></div>`;
}

// ========== 算法选择 / Algorithm Picker ==========

export function renderAlgorithmPicker(): string {
    return `<div class="card mb-6" id="algorithm-picker"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="shield-check" class="w-5 h-5" style="color:var(--accent)"></i><span>${I18n.t('algorithm.select')}</span><span class="text-sm font-normal ml-auto" style="color:var(--text-secondary)" id="algo-status">0 ${I18n.t('algorithm.selected')}</span></h2>
<div class="flex flex-wrap gap-2 mb-4"><button class="preset-btn text-xs px-3 py-1.5 rounded-full border" style="border-color:var(--border);color:var(--text-secondary)" data-preset="fileCheck">${I18n.t('preset.fileCheck')}</button><button class="preset-btn text-xs px-3 py-1.5 rounded-full border" style="border-color:var(--border);color:var(--text-secondary)" data-preset="secure">${I18n.t('preset.secure')}</button><button class="preset-btn text-xs px-3 py-1.5 rounded-full border" style="border-color:var(--border);color:var(--text-secondary)" data-preset="fast">${I18n.t('preset.fast')}</button><button class="preset-btn text-xs px-3 py-1.5 rounded-full border" style="border-color:var(--border);color:var(--text-secondary)" data-preset="smCompliance">${I18n.t('preset.smCompliance')}</button><button class="preset-btn text-xs px-3 py-1.5 rounded-full border" style="border-color:var(--border);color:var(--text-secondary)" data-preset="all">${I18n.t('preset.all')}</button></div>
<div class="mb-4"><input type="text" id="algo-search" class="input-field w-full text-sm" placeholder="${I18n.t('algoInfo.searchPlaceholder')}"></div>
<div id="algo-groups" class="space-y-3">${renderAlgoGroup('standard', ['sha1', 'sha256', 'sha384', 'sha512'], true)}${renderAlgoGroup('modern', ['sha3_256', 'sha3_384', 'sha3_512', 'blake2b_256', 'blake2b_512', 'blake2s_256', 'blake3', 'ripemd160'], true)}${renderAlgoGroup('legacy', ['md5', 'sm3', 'whirlpool'], true)}${renderAlgoGroup('fast', ['crc32', 'crc32c', 'adler32', 'xxhash64', 'xxhash3'], false)}</div>
<div id="hmac-key-container" class="mt-3 hidden"><label class="block text-sm font-medium mb-1">${I18n.t('algoInfo.hmacLabel')}</label><div class="flex gap-2"><input type="text" id="hmac-key" class="input-field flex-1 text-sm" placeholder="${I18n.t('algoInfo.hmacPlaceholder')}"><button id="hmac-toggle" class="btn-secondary text-xs px-3">HMAC: OFF</button></div><p class="text-xs mt-1" style="color:var(--text-secondary)">${I18n.t('algoInfo.hmacDesc')}</p></div>
<div class="mt-4 pt-3 flex items-center justify-between text-xs" style="border-top:1px solid var(--border);color:var(--text-secondary)"><span id="algo-count">0 ${I18n.t('algorithm.selected')}</span><span id="chunk-info" title="分块大小：系统自动选择最优值" style="cursor:help">⏳ 准备就绪</span></div></div>`;
}

const NON_STANDARD_ALGOS = new Set(['whirlpool', 'xxhash3']);

export function renderAlgoGroup(cat: string, algos: string[], expanded: boolean): string {
    return `<div class="algo-group" data-group="${cat}"><div class="flex items-center justify-between cursor-pointer select-none py-1" data-toggle="${cat}"><div class="flex items-center gap-2"><i data-lucide="chevron-${expanded ? 'down' : 'right'}" class="w-4 h-4 transition-transform" style="color:var(--text-secondary)"></i><span class="text-sm font-medium">${I18n.t('algorithm.group.' + cat)}</span><span class="text-xs" style="color:var(--text-secondary)">(${algos.length})</span></div><button class="text-xs px-2 py-0.5 rounded" data-select-all="${cat}" style="color:var(--text-secondary)">${I18n.t('algoInfo.selectAll')}</button></div><div class="${expanded ? '' : 'hidden'} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-1" data-group-content="${cat}">${algos.map(a => {
        const ns = NON_STANDARD_ALGOS.has(a);
        return '<button class="algo-card flex items-center gap-2 p-2 rounded-lg border text-sm text-left transition-all" data-algo="' + a + '" data-tooltip="' + I18n.t('algo.' + a + '.desc') + (ns ? ' ⚠️ ' + I18n.t('algo.nonStandard') : '') + '" style="border-color:var(--border)"><span class="font-mono text-xs truncate">' + a.toUpperCase() + (ns ? ' ⚠' : '') + '</span></button>';
    }).join('')}</div></div>`;
}

// ========== 拖放区 / Dropzone ==========

export function renderDropzone(): string {
    return `<div class="card mb-6" id="file-dropzone"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="file-upload" class="w-5 h-5" style="color:var(--accent)"></i><span>${I18n.t('dropzone.hint')}</span></h2>
<div id="drop-area" class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all" style="border-color:var(--border)"><i data-lucide="upload-cloud" class="w-16 h-16 mx-auto mb-4" style="color:var(--text-secondary)"></i><p class="mb-2 text-lg">${I18n.t('dropzone.hint')}</p><p class="text-sm mb-4" style="color:var(--text-secondary)">${I18n.t('dropzone.desc')}</p><label class="btn-primary inline-flex items-center cursor-pointer"><i data-lucide="folder-open" class="w-4 h-4 mr-2"></i><span>${I18n.t('dropzone.selectFile')}</span><input type="file" id="file-input" class="hidden" multiple></label></div>
<div class="mt-4"><button id="text-toggle" class="flex items-center gap-2 text-sm font-medium cursor-pointer" style="color:var(--text-secondary)"><i data-lucide="chevron-right" class="w-4 h-4 transition-transform" id="text-chevron"></i><span>${I18n.t('dropzone.textMode')}</span></button><div id="text-content" class="hidden mt-3"><textarea id="text-input-area" class="input-field w-full h-24 resize-none text-sm font-mono" placeholder="${I18n.t('dropzone.textMode')}"></textarea><button id="text-hash-btn" class="btn-primary mt-3 flex items-center gap-2"><i data-lucide="play" class="w-4 h-4"></i><span>${I18n.t('button.calculate')}</span></button><div id="text-results" class="mt-3 hidden space-y-2"></div></div></div>
<div id="file-list" class="mt-4 hidden"><h3 class="font-medium mb-2">${I18n.t('dropzone.selectedFiles')}</h3><ul id="selected-files" class="space-y-1 max-h-40 overflow-y-auto" style="background:var(--bg-tertiary);border-radius:8px;padding:4px"></ul></div>
<div class="mt-4 flex flex-wrap gap-2"><button id="calculate-btn" class="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled><i data-lucide="play" class="w-4 h-4"></i><span>${I18n.t('button.calculate')}</span></button><button id="cancel-btn" class="btn-secondary hidden flex items-center gap-2" style="color:var(--error);border-color:var(--error)"><i data-lucide="x-circle" class="w-4 h-4"></i><span>${I18n.t('button.cancel')}</span></button><button id="clear-btn" class="btn-secondary flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4"></i><span>${I18n.t('button.clear')}</span></button></div></div>`;
}

export function renderCompareArea(): string {
    return `<div class="card mb-6" id="compare-area"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="search" class="w-5 h-5" style="color:var(--accent)"></i><span>${I18n.t('compare.title')}</span></h2><div class="space-y-3"><div class="flex gap-2"><input type="text" id="compare-hash-input" class="input-field flex-1 text-sm font-mono" placeholder="${I18n.t('compare.placeholder')}" autocomplete="off" spellcheck="false"><button id="compare-btn" class="btn-primary whitespace-nowrap flex items-center gap-1"><i data-lucide="git-compare" class="w-4 h-4"></i><span>${I18n.t('button.compare')}</span></button></div><p id="hash-detected" class="text-xs hidden items-center gap-1" style="color:var(--accent)"><i data-lucide="sparkles" class="w-3.5 h-3.5"></i><span id="hash-detected-text"></span></p><p class="text-xs" style="color:var(--text-secondary)">${I18n.t('compare.noComparison')}</p></div><div id="comparison-result" class="mt-4 hidden"></div></div>`;
}

// ========== 帮助页 / Help Page ==========

export function renderHelpPage(): string {
  const algoList: Record<string,string> = { standard: 'SHA-1, SHA-256, SHA-384, SHA-512', modern: 'SHA3, BLAKE2, BLAKE3, RIPEMD-160', legacy: 'MD5, SM3, Whirlpool', fast: 'CRC32, Adler-32, xxHash64, xxHash3' };
  const algoTiles = ['standard','modern','legacy','fast'].map(cat =>
    '<div class="p-3 rounded-lg" style="background:var(--bg-tertiary)"><span class="text-sm font-medium block mb-1">'+I18n.t('algorithm.group.'+cat)+'</span><span class="text-xs" style="color:var(--text-secondary)">'+algoList[cat]+'</span></div>'
  ).join('');
  return `
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="play-circle" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.quickStart')}</h2>
      <div class="space-y-3"><div class="flex items-start gap-3 p-3 rounded-lg" style="background:var(--bg-tertiary)"><span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style="background:var(--accent);color:white">1</span><p class="text-sm" style="color:var(--text-secondary)">${I18n.t('help.quickStart1')}</p></div>
      <div class="flex items-start gap-3 p-3 rounded-lg" style="background:var(--bg-tertiary)"><span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style="background:var(--accent);color:white">2</span><p class="text-sm" style="color:var(--text-secondary)">${I18n.t('help.quickStart2')}</p></div>
      <div class="flex items-start gap-3 p-3 rounded-lg" style="background:var(--bg-tertiary)"><span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style="background:var(--accent);color:white">3</span><p class="text-sm" style="color:var(--text-secondary)">${I18n.t('help.quickStart3')}</p></div></div></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="book-open" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.algoGuide')}</h2>
      <p class="text-sm mb-3" style="color:var(--text-secondary)">${I18n.t('help.algoGuideDesc')}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">${algoTiles}</div>
      <div class="p-3 rounded-lg" style="background:var(--accent-subtle)"><p class="text-xs" style="color:var(--accent)">${I18n.t('help.algoTip')}</p></div></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.chunkExplain')}</h2>
      <p class="text-sm" style="color:var(--text-secondary)">${I18n.t('help.chunkExplainDetail')}</p></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="key" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.hmacExplain')}</h2>
      <p class="text-sm" style="color:var(--text-secondary)">${I18n.t('help.hmacExplainDetail')}</p></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="lightbulb" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.scenarios')}</h2>
      <div class="space-y-3">
        ${['scenario1','scenario2','scenario3','scenario4'].map(k => '<div class="p-3 rounded-lg" style="background:var(--bg-tertiary)"><h3 class="text-sm font-medium mb-1">'+I18n.t('help.'+k+'Title')+'</h3><p class="text-xs" style="color:var(--text-secondary)">'+I18n.t('help.'+k+'Desc')+'</p></div>').join('')}
      </div></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="graduation-cap" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.tutorials')}</h2>
      <p class="text-sm mb-4" style="color:var(--text-secondary)">${I18n.t('help.tutorialDesc')}</p>
      <div class="space-y-3">${['firstHash','verifyDownload','multiFile'].map((id,i) => '<div class="flex items-center justify-between p-4 rounded-lg" style="background:var(--bg-tertiary)"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style="background:var(--accent);color:white">'+(i+1)+'</div><span class="text-sm font-medium">'+I18n.t('tutorial.'+id)+'</span></div><button class="btn-primary text-xs px-4 py-1.5 tutorial-start" data-tutorial="'+id+'">'+I18n.t('onboarding.finish')+'</button></div>').join('')}</div></div>
    <div class="card mb-6"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="keyboard" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.shortcuts')}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">${[['Ctrl+K','Command Palette'],['Ctrl+O','Select File'],['Ctrl+Enter','Start Calculation'],['Ctrl+E','Export Results'],['Ctrl+D','Dark Mode'],['Escape','Cancel/Close']].map(([k,l]) => '<div class="flex items-center justify-between p-2 rounded" style="background:var(--bg-tertiary)"><span style="color:var(--text-secondary)">'+l+'</span><kbd class="text-xs px-2 py-1 rounded font-mono" style="background:var(--bg-secondary);border:1px solid var(--border)">'+k+'</kbd></div>').join('')}</div></div>
    <div class="card"><h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="info" class="w-5 h-5" style="color:var(--accent)"></i>${I18n.t('help.about')}</h2>
      <p class="text-sm mb-2" style="color:var(--text-secondary)">${I18n.t('help.privacy')}</p>
      <p class="text-sm mb-3" style="color:var(--text-secondary)">Version 4.0.0 · <a href="LICENSE" target="_blank" style="color:var(--accent)">${I18n.t('common.license')}</a></p>
      <a href="https://github.com/KitaBlan/FileHashCalculator" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm hover:underline" style="color:var(--accent)"><i data-lucide="github" class="w-4 h-4"></i>GitHub</a></div>`;
}

// ========== 弹窗 / Modals ==========

export function renderSettingsModal(saved: Record<string,any>): string {
  const renderSettingToggle = (key: string, value: boolean, label: string, desc: string): string =>
    '<div class="flex items-center justify-between"><div><label class="text-sm font-medium">'+label+'</label>'+(desc?'<p class="text-xs" style="color:var(--text-secondary)">'+desc+'</p>':'')+'</div><button type="button" id="setting-'+key+'" class="toggle-switch'+(value?' active':'')+'" role="switch" aria-checked="'+value+'"><span class="toggle-thumb"></span></button></div>';
  const renderSettingSelect = (key: string, value: string, label: string, options: Array<{value:string;label:string}>): string =>
    '<div><label class="block text-sm font-medium mb-1">'+label+'</label><select id="setting-'+key+'" class="input-field w-full text-sm">'+options.map(o => '<option value="'+o.value+'"'+(o.value===value?' selected':'')+'>'+o.label+'</option>').join('')+'</select></div>';

  return '<div class="card max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"><div class="flex justify-between items-center mb-4"><h2 class="text-lg font-semibold flex items-center gap-2"><i data-lucide="settings" class="w-5 h-5" style="color:var(--accent)"></i><span>'+I18n.t('settings.title')+'</span></h2><button class="close-settings p-1 rounded-full hover:opacity-70"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="space-y-4">'
    +renderSettingToggle('autoCalc',saved.autoCalculate,I18n.t('settings.autoCalc'),I18n.t('settings.autoCalcDesc'))
    +renderSettingSelect('chunkMode',saved.chunkMode,I18n.t('settings.chunkMode'),[{value:'auto',label:I18n.t('settings.chunkAuto')},{value:'32k',label:'32 KB'},{value:'64k',label:'64 KB'},{value:'256k',label:'256 KB'},{value:'512k',label:'512 KB'},{value:'1m',label:'1 MB'},{value:'2m',label:'2 MB'},{value:'4m',label:'4 MB'}])+'<p class="text-xs" style="color:var(--text-secondary);margin-top:-0.5rem">'+I18n.t('settings.chunkModeDesc')+'</p>'
    +renderSettingSelect('resultFormat',saved.resultFormat,I18n.t('settings.resultFormat'),[{value:'lowercase',label:I18n.t('settings.lowercase')},{value:'uppercase',label:I18n.t('settings.uppercase')}])
    +renderSettingSelect('theme',saved.theme,I18n.t('settings.theme'),[{value:'system',label:I18n.t('settings.themeSystem')},{value:'light',label:I18n.t('settings.themeLight')},{value:'dark',label:I18n.t('settings.themeDark')}])
    +renderSettingSelect('language',saved.language,I18n.t('settings.language'),[{value:'auto',label:I18n.t('settings.langAuto')},{value:'zh',label:I18n.t('settings.langZh')},{value:'en',label:I18n.t('settings.langEn')}])
    +renderSettingSelect('exportFormat',saved.exportFormat,I18n.t('settings.exportFormat'),[{value:'txt',label:I18n.t('export.txtDesc')},{value:'csv',label:I18n.t('export.csvDesc')},{value:'json',label:I18n.t('export.jsonDesc')}])
    +'</div><div class="mt-6 flex justify-between"><button class="reset-settings btn-secondary text-xs">'+I18n.t('settings.resetDefaults')+'</button><button class="save-settings btn-primary">'+I18n.t('button.save')+'</button></div></div>';
}

export function renderExportModal(defaultName: string): string {
  return '<div class="card max-w-md w-full mx-4"><div class="flex justify-between items-center mb-4"><h2 class="text-lg font-semibold flex items-center gap-2"><i data-lucide="download" class="w-5 h-5" style="color:var(--accent)"></i><span>'+I18n.t('export.title')+'</span></h2><button class="close-export p-1 rounded-full hover:opacity-70"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="space-y-4"><div><label class="block text-sm font-medium mb-1">'+I18n.t('export.fileName')+'</label><input type="text" id="export-filename" class="input-field w-full text-sm" value="'+defaultName+'"><label class="flex items-center gap-2 mt-2 cursor-pointer"><input type="checkbox" id="export-timestamp" class="w-4 h-4" style="accent-color:var(--accent)" checked><span class="text-xs" style="color:var(--text-secondary)">'+I18n.t('export.addTimestamp')+'</span></label></div><div><label class="block text-sm font-medium mb-1">'+I18n.t('export.format')+'</label><select id="export-format" class="input-field w-full text-sm"><option value="txt">'+I18n.t('export.txtDesc')+'</option><option value="csv">'+I18n.t('export.csvDesc')+'</option><option value="json">'+I18n.t('export.jsonDesc')+'</option></select></div><div><label class="block text-sm font-medium mb-1">'+I18n.t('export.preview')+'</label><pre id="export-preview" class="text-xs p-3 rounded-lg overflow-auto max-h-32 font-mono" style="background:var(--bg-tertiary);color:var(--text-secondary)"></pre></div></div><div class="mt-6 flex justify-end gap-2"><button class="close-export btn-secondary">'+I18n.t('common.cancel')+'</button><button class="confirm-export btn-primary">'+I18n.t('button.confirmExport')+'</button></div></div>';
}

// ========== 计算结果 / Results ==========

/** 转义 HTML / Escape HTML */
function esc(str: string): string { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

/** 格式化文件大小 / Format file size */
function fmtSize(bytes: number): string { if (bytes === 0) return '0 Bytes'; const k = 1024; const s = ['Bytes','KB','MB','GB','TB']; const i = Math.floor(Math.log(bytes)/Math.log(k)); return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+s[i]; }

/** 进度条区域 / Progress area */
export function renderProgressContent(filename: string, pct: number, idx: number, total: number, remaining: string, chunkLabel: string, chunkModeStr: string): string {
  return '<div class="card"><div class="flex items-center gap-6"><div class="relative flex-shrink-0"><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="35" fill="none" stroke="var(--bg-tertiary)" stroke-width="6"/><circle cx="40" cy="40" r="35" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-dasharray="220" stroke-dashoffset="'+(220-(220*pct/100))+'" transform="rotate(-90 40 40)" style="transition:stroke-dashoffset 0.3s ease"/></svg><span class="absolute inset-0 flex items-center justify-center text-sm font-bold" style="color:var(--accent)">'+pct+'%</span></div><div class="flex-1 min-w-0"><p class="font-medium text-sm truncate">'+(total>1?'('+(idx+1)+'/'+total+') ':'')+esc(filename)+'</p><p class="text-xs mt-1" style="color:var(--text-secondary)">'+I18n.t('progress.remaining')+remaining+'</p>'+(chunkLabel?'<p class="text-xs mt-1" style="color:var(--text-secondary)">'+I18n.t('progress.chunkSize')+': '+chunkLabel+(chunkModeStr!=='auto'?' (手动)':'')+'</p>':'')+'</div></div></div>';
}

/** 计算结果列表 / Results list */
export function renderResultsList(results: any[]): string {
  return '<h2 class="text-lg font-semibold mb-4 flex items-center gap-2"><i data-lucide="check-circle" class="w-5 h-5" style="color:var(--success)"></i><span>'+I18n.t('result.title')+'</span></h2><div class="space-y-4">'+results.map(r => '<div class="card result-card"><div class="flex justify-between items-center mb-3"><div class="flex items-center gap-2 min-w-0"><i data-lucide="file" class="w-5 h-5 flex-shrink-0" style="color:var(--accent)"></i><h3 class="font-medium truncate">'+esc(r.filename)+'</h3></div><span class="text-xs flex-shrink-0" style="color:var(--text-secondary)">'+fmtSize(r.size)+' · '+r.duration+'ms</span></div><div class="space-y-2">'+Object.entries(r.hashValues).map(([algo,hash]) => '<div class="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg gap-2" style="background:var(--bg-tertiary)"><span class="text-xs font-medium flex-shrink-0 w-24">'+algo.toUpperCase()+'</span><div class="flex items-center gap-2 flex-1 min-w-0"><code class="text-xs font-mono truncate flex-1">'+esc(hash as string)+'</code><button class="copy-hash-btn p-1 rounded hover:scale-110 transition-transform flex-shrink-0" data-hash="'+esc(hash as string)+'" data-algo="'+algo+'"><i data-lucide="copy" class="w-3.5 h-3.5" style="color:var(--text-secondary)"></i></button></div></div>').join('')+'</div></div>').join('')+'</div><div class="mt-6 flex flex-wrap gap-2"><button id="copy-all-btn" class="btn-secondary flex items-center gap-2"><i data-lucide="copy" class="w-4 h-4"></i>'+I18n.t('button.copyAll')+'</button><button id="export-btn" class="btn-secondary flex items-center gap-2"><i data-lucide="download" class="w-4 h-4"></i>'+I18n.t('button.export')+'</button></div>';
}

/** 多文件比较 / Multi-file comparison */
export function renderMultiFileComparison(comparisons: Array<{algo:string; allMatch:boolean; groups?:Record<string,string[]>}>): string {
  let html = '';
  for (const comp of comparisons) {
    if (comp.allMatch) {
      html += '<div class="p-3 rounded-lg mb-2" style="background:oklch(68% 0.17 155 / 0.1);border:1px solid var(--success)"><div class="flex items-center gap-2" style="color:var(--success)"><i data-lucide="check-circle" class="w-4 h-4"></i><span class="text-sm font-medium">'+comp.algo.toUpperCase()+': '+I18n.t('compare.allMatch')+'</span></div></div>';
    } else {
      html += '<div class="p-3 rounded-lg mb-2" style="background:var(--bg-tertiary)"><span class="text-sm font-medium">'+comp.algo.toUpperCase()+': '+I18n.t('compare.mismatch')+'</span>';
      if (comp.groups) {
        Object.entries(comp.groups).forEach(([hash,files]) => { html += '<div class="mt-2 p-2 rounded" style="background:var(--bg-secondary)"><span class="text-xs font-mono block mb-1" style="color:var(--text-secondary)">'+esc(hash?.substring(0,32))+'...</span><ul class="text-xs space-y-0.5">'+files.map(f => '<li>• '+esc(f)+'</li>').join('')+'</ul></div>'; });
      }
      html += '</div>';
    }
  }
  return html;
}

/** 哈希比较：匹配结果 / Hash compare: match result */
export function renderCompareMatch(matches: Array<{filename:string;algo:string}>): string {
  return '<div class="p-4 rounded-lg" style="background:oklch(68% 0.17 155 / 0.1);border:1px solid var(--success)"><h3 class="font-medium flex items-center gap-2" style="color:var(--success)"><i data-lucide="check-circle" class="w-5 h-5"></i>'+I18n.t('compare.match')+'</h3><ul class="mt-2 space-y-1">'+matches.map(m => '<li class="text-sm flex items-center gap-2"><i data-lucide="file" class="w-4 h-4" style="color:var(--text-secondary)"></i><span class="font-medium">'+esc(m.filename)+'</span><span class="text-xs" style="color:var(--text-secondary)">— '+esc(m.algo.toUpperCase())+'</span></li>').join('')+'</ul></div>';
}

/** 哈希比较：不匹配 / Hash compare: mismatch */
export function renderCompareMismatch(): string {
  return '<div class="p-4 rounded-lg" style="background:oklch(63% 0.24 27 / 0.1);border:1px solid var(--error)"><h3 class="font-medium flex items-center gap-2" style="color:var(--error)"><i data-lucide="x-circle" class="w-5 h-5"></i>'+I18n.t('compare.mismatch')+'</h3><p class="text-sm mt-1" style="color:var(--text-secondary)">'+I18n.t('compare.mismatchDetail')+'</p></div>';
}

/** 哈希比较：无效输入 / Hash compare: invalid input */
export function renderCompareInvalid(): string {
  return '<div class="p-3 rounded-lg text-sm" style="background:var(--warning);border:1px solid var(--warning)"><span style="color:var(--warning)">'+I18n.t('compare.invalidHex')+'</span></div>';
}

/** 哈希比较：无计算结果 / Hash compare: no results yet */
export function renderCompareNoCalc(): string {
  return '<div class="p-3 rounded-lg text-sm" style="background:var(--bg-tertiary)"><span style="color:var(--text-secondary)">'+I18n.t('compare.noCalcResultHint')+'</span></div>';
}

/** Toast 通知 / Toast notification */
export function renderToast(title: string, message: string, type: string, duration: number): string {
  const icons: Record<string,string> = { success:'check-circle', info:'info', warning:'alert-triangle', error:'x-circle' };
  const colors: Record<string,string> = { success:'var(--success)', info:'var(--accent)', warning:'var(--warning)', error:'var(--error)' };
  const icon = icons[type] || 'info';
  const color = colors[type] || 'var(--accent)';
  return '<i data-lucide="'+icon+'" class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:'+color+'"></i><div class="flex-1 min-w-0"><h4 class="font-medium text-sm">'+esc(title)+'</h4>'+(message?'<p class="text-xs mt-1" style="color:var(--text-secondary)">'+esc(message)+'</p>':'')+(duration>0?'<div class="mt-2 h-1 rounded-full overflow-hidden" style="background:var(--bg-tertiary)"><div class="toast-progress h-full rounded-full" style="background:'+color+';width:100%;transition:width '+duration+'ms linear"></div></div>':'')+'</div><button class="toast-close p-1 rounded hover:opacity-70 flex-shrink-0"><i data-lucide="x" class="w-4 h-4"></i></button>';
}
