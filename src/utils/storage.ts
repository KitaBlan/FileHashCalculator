/**
 * 设置管理 / Settings management
 * @module utils/storage
 */

const DEFAULTS = {
  autoCalculate: false,
  chunkMode: 'auto',
  chunkSize: 524288,
  resultFormat: 'lowercase',
  theme: 'system',
  language: 'auto',
  animation: 'full',
  exportFormat: 'txt',
  historyRetention: 30,
  historyLimit: 500,
  clipboardWatch: false,
} as const;

const STORAGE_KEY = 'hashCalculatorSettings';

export const SettingsManager = {
  _settings: { ...DEFAULTS } as Record<string, any>,

  init() {
    this._settings = { ...DEFAULTS };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) Object.assign(this._settings, JSON.parse(saved));
    } catch (e) { console.warn('Failed to load settings:', e); }
  },

  get(key: string): any { return this._settings?.[key] ?? (DEFAULTS as any)[key]; },
  set(key: string, value: any) { if (this._settings) this._settings[key] = value; },
  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings)); return true; }
    catch { return false; }
  },
  getAll() { return { ...this._settings }; },
  reset() { this._settings = { ...DEFAULTS }; this.save(); },
};
