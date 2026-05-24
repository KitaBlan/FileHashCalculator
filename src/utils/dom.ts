/**
 * DOM 工具 / DOM utilities
 * @module utils/dom
 */

/** 选择器 / Selector */
export const $ = (sel: string, ctx: Document | HTMLElement = document): HTMLElement | null => ctx.querySelector(sel);

/** 转义 HTML 防 XSS / Escape HTML to prevent XSS */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
