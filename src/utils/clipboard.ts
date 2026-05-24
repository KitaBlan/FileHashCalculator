/**
 * 剪贴板操作 / Clipboard operations
 * @module utils/clipboard
 */

/** 复制到剪贴板 / Copy to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && globalThis.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // 降级方案 / Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-999999px;top:-999999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}
