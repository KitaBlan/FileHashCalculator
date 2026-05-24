/**
 * 格式化工具 / Formatting utilities
 * @module utils/format
 */

/** 格式化文件大小 / Format file size */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** 格式化时间戳 / Format timestamp */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** 计算剩余时间 / Calculate remaining time */
export function calculateRemainingTime(processed: number, total: number, startTime: number): string {
  if (processed === 0) return '计算中...';
  const elapsed = Date.now() - startTime;
  const rate = processed / elapsed;
  const remainingMs = (total - processed) / rate;
  if (remainingMs < 1000) return '即将完成';
  if (remainingMs < 60000) return `${Math.ceil(remainingMs / 1000)} 秒`;
  const m = Math.floor(remainingMs / 60000);
  const s = Math.ceil((remainingMs % 60000) / 1000);
  return `${m} 分 ${s} 秒`;
}

/** 格式化分块大小 / Format chunk size */
export function formatChunkSize(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576) + ' MB';
  return (bytes / 1024) + ' KB';
}
