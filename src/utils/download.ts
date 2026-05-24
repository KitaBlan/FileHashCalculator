/**
 * 文件下载 / File download
 * @module utils/download
 */

/** 下载文件 / Download file */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** 导出为 TXT / Export as TXT */
export function exportAsTxt(results: any[], includeTimestamp = true): string {
  let content = '文件哈希计算结果 / File Hash Results\n' + '='.repeat(50) + '\n\n';
  if (includeTimestamp) content += `生成时间 / Generated: ${new Date().toLocaleString()}\n\n`;
  results.forEach((r) => {
    content += `文件名 / File: ${r.filename}\n大小 / Size: ${r.size}\n`;
    Object.entries(r.hashValues).forEach(([algo, hash]) => { content += `${algo.toUpperCase()}: ${hash}\n`; });
    content += '\n';
  });
  return content;
}

/** 导出为 CSV / Export as CSV */
export function exportAsCsv(results: any[]): string {
  const algos = new Set<string>();
  results.forEach((r) => Object.keys(r.hashValues).forEach((a) => algos.add(a)));
  const headers = ['Filename', 'Size', ...[...algos].map((a) => a.toUpperCase())];
  let csv = headers.join(',') + '\n';
  results.forEach((r) => {
    const row = [`"${r.filename}"`, `"${r.size}"`, ...[...algos].map((a) => r.hashValues[a] || '')];
    csv += row.join(',') + '\n';
  });
  return csv;
}

/** 导出为 JSON / Export as JSON */
export function exportAsJson(results: any[]): string {
  return JSON.stringify(results, null, 2);
}
