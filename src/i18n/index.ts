/**
 * i18n 引擎 / i18n Engine
 *
 * 支持嵌套 key、插值、中文回退
 * Supports nested keys, interpolation, Chinese fallback
 *
 * @module i18n
 */
import zh from './zh.ts';
import en from './en.ts';

type Messages = typeof zh;
type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string ? (T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K) : never }[keyof T]
  : never;

const messages: Record<string, any> = { zh, en };
let currentLang = 'zh';

function detectLanguage(saved?: string): string {
  if (saved && saved !== 'auto') return saved;
  const browser = (navigator.languages?.[0]) || navigator.language || 'en';
  return browser.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export const I18n = {
  init(savedLang?: string) {
    currentLang = detectLanguage(savedLang);
    this.apply();
  },

  t(key: string, params?: Record<string, string | number>): string {
    let text = getNestedValue(messages[currentLang], key);
    if (text === undefined) text = getNestedValue(messages['zh'], key);
    if (text === undefined) return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = (text as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return text as string;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.getAttribute('data-i18n')!);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      (el as HTMLInputElement).placeholder = this.t(el.getAttribute('data-i18n-placeholder')!);
    });
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  },

  setLang(lang: string) {
    currentLang = lang === 'auto' ? detectLanguage(lang) : lang;
    this.apply();
  },

  get currentLang() { return currentLang; },
};
