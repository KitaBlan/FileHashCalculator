/**
 * 工具函数模块
 * 提供通用的辅助函数
 */

// 导出工具函数对象
const Utils = {
    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的大小字符串
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 格式化时间戳
     * @param {number} timestamp - 时间戳
     * @returns {string} 格式化后的时间字符串
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    },

    /**
     * 计算估计剩余时间
     * @param {number} processed - 已处理的字节数
     * @param {number} total - 总字节数
     * @param {number} startTime - 开始时间戳
     * @returns {string} 估计剩余时间字符串
     */
    calculateRemainingTime(processed, total, startTime) {
        if (processed === 0) return '计算中...';
        
        const elapsed = Date.now() - startTime;
        const rate = processed / elapsed; // 字节/毫秒
        const remainingBytes = total - processed;
        const remainingMs = remainingBytes / rate;
        
        if (remainingMs < 1000) {
            return '即将完成';
        } else if (remainingMs < 60000) {
            return `${Math.ceil(remainingMs / 1000)} 秒`;
        } else {
            const minutes = Math.floor(remainingMs / 60000);
            const seconds = Math.ceil((remainingMs % 60000) / 1000);
            return `${minutes} 分 ${seconds} 秒`;
        }
    },

    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>} 是否复制成功
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('复制失败:', error);
            return false;
        }
    },

    /**
     * 下载文本内容为文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * 导出结果为TXT格式
     * @param {Array} results - 计算结果数组
     * @param {boolean} includeTimestamp - 是否包含时间戳
     * @returns {string} TXT格式的内容
     */
    exportAsTxt(results, includeTimestamp = true) {
        let content = '文件哈希计算结果\n';
        content += '=' .repeat(50) + '\n\n';
        
        if (includeTimestamp) {
            content += `生成时间: ${this.formatTimestamp(Date.now())}\n\n`;
        }
        
        results.forEach(result => {
            content += `文件名: ${result.filename}\n`;
            content += `文件大小: ${this.formatFileSize(result.size)}\n`;
            
            Object.entries(result.hashValues).forEach(([algorithm, hash]) => {
                content += `${algorithm.toUpperCase()}: ${hash}\n`;
            });
            
            content += '\n';
        });
        
        return content;
    },

    /**
     * 导出结果为CSV格式
     * @param {Array} results - 计算结果数组
     * @param {boolean} includeTimestamp - 是否包含时间戳
     * @returns {string} CSV格式的内容
     */
    exportAsCsv(results, includeTimestamp = true) {
        // 获取所有使用的算法
        const algorithms = new Set();
        results.forEach(result => {
            Object.keys(result.hashValues).forEach(algo => algorithms.add(algo));
        });
        
        // 构建CSV头部
        let headers = ['文件名', '文件大小'];
        algorithms.forEach(algo => headers.push(algo.toUpperCase()));
        
        let content = headers.join(',') + '\n';
        
        // 添加数据行
        results.forEach(result => {
            let row = [
                `"${result.filename}"`,  // 用引号包裹文件名，防止包含逗号
                `"${this.formatFileSize(result.size)}"`
            ];
            
            algorithms.forEach(algo => {
                row.push(result.hashValues[algo] || '');
            });
            
            content += row.join(',') + '\n';
        });
        
        return content;
    },

    /**
     * 比较两个哈希值是否相同（忽略大小写）
     * @param {string} hash1 - 第一个哈希值
     * @param {string} hash2 - 第二个哈希值
     * @returns {boolean} 是否相同
     */
    compareHashes(hash1, hash2) {
        if (!hash1 || !hash2) return false;
        return hash1.toLowerCase() === hash2.toLowerCase();
    },

    /**
     * 高亮显示两个字符串的不同部分
     * @param {string} str1 - 第一个字符串
     * @param {string} str2 - 第二个字符串
     * @returns {Array} 包含HTML的数组 [highlightedStr1, highlightedStr2]
     */
    highlightDifferences(str1, str2) {
        if (!str1 || !str2) return [str1 || '', str2 || ''];
        
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
        
        let result1 = '';
        let result2 = '';
        let i = 0;
        
        // 找到第一个不同的字符位置
        while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
            result1 += str1[i];
            result2 += str2[i];
            i++;
        }
        
        // 高亮显示不同的部分
        if (i < str1.length) {
            result1 += `<span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-0.5 rounded">${str1.substring(i)}</span>`;
        }
        
        if (i < str2.length) {
            result2 += `<span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-0.5 rounded">${str2.substring(i)}</span>`;
        }
        
        return [result1, result2];
    }
};