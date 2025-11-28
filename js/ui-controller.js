/**
 * UI控制器模块
 * 负责处理用户界面交互和通知
 */

// UI控制器对象
const UI = {
    /**
     * 初始化UI控制器
     */
    init() {
        this.setupEventListeners();
        this.setupAlgorithmSelection();
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 导航链接点击事件
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
            });
        });
        
        // 复制所有结果按钮
        document.getElementById('copy-all-btn').addEventListener('click', () => {
            this.copyAllResults();
        });
        
        // 导出结果按钮
        document.getElementById('export-btn').addEventListener('click', () => {
            this.openExportModal();
        });
        
        // 关闭导出弹窗
        document.getElementById('close-export').addEventListener('click', () => {
            this.closeExportModal();
        });
        
        // 确认导出
        document.getElementById('confirm-export').addEventListener('click', () => {
            this.exportResults();
        });
        
        // 点击导出弹窗外部关闭弹窗
        document.getElementById('export-modal').addEventListener('click', (e) => {
            if (e.target.id === 'export-modal') {
                this.closeExportModal();
            }
        });
        
        // 关闭通知
        document.getElementById('close-notification').addEventListener('click', () => {
            this.hideNotification();
        });
        
        // 哈希值比较按钮
        document.getElementById('compare-btn').addEventListener('click', () => {
            this.compareHash();
        });
    },
    
    /**
     * 设置算法选择相关的事件
     */
    setupAlgorithmSelection() {
        const checkboxes = document.querySelectorAll('.algorithm-checkbox');
        const hmacKeyContainer = document.getElementById('hmac-key-container');
        
        // 监听算法选择变化
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // 检查是否选择了HMAC算法
                const hmacSelected = Array.from(checkboxes).some(cb => 
                    cb.checked && cb.value.startsWith('hmac-')
                );
                
                // 显示或隐藏HMAC密钥输入框
                if (hmacSelected) {
                    hmacKeyContainer.classList.remove('hidden');
                } else {
                    hmacKeyContainer.classList.add('hidden');
                }
            });
        });
    },
    
    /**
     * 切换页面部分
     * @param {string} sectionId - 要显示的部分ID
     */
    switchSection(sectionId) {
        // 隐藏所有部分
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // 移除所有导航链接的活动状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 显示选定的部分
        document.getElementById(`${sectionId}-section`).classList.remove('hidden');
        
        // 设置对应的导航链接为活动状态
        document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    },
    
    /**
     * 显示通知
     * @param {string} title - 通知标题
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 ('success', 'error', 'warning', 'info')
     * @param {number} duration - 显示持续时间（毫秒），默认为3000
     */
    showNotification(title, message, type = 'info', duration = 3000) {
        const notification = document.getElementById('notification');
        const titleElement = document.getElementById('notification-title');
        const messageElement = document.getElementById('notification-message');
        const iconElement = document.getElementById('notification-icon');
        
        // 设置通知内容
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // 设置图标和样式
        let iconName, bgColor, textColor;
        
        switch (type) {
            case 'success':
                iconName = 'check-circle';
                bgColor = 'bg-green-50 dark:bg-green-900/20';
                textColor = 'text-green-600 dark:text-green-400';
                break;
            case 'error':
                iconName = 'x-circle';
                bgColor = 'bg-red-50 dark:bg-red-900/20';
                textColor = 'text-red-600 dark:text-red-400';
                break;
            case 'warning':
                iconName = 'alert-triangle';
                bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
                textColor = 'text-yellow-600 dark:text-yellow-400';
                break;
            case 'info':
            default:
                iconName = 'info';
                bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                textColor = 'text-blue-600 dark:text-blue-400';
                break;
        }
        
        // 清除之前的样式
        iconElement.className = '';
        notification.className = 'fixed bottom-4 right-4 max-w-sm shadow-lg rounded-lg p-4 transform transition-all duration-300 z-50';
        
        // 添加新样式
        notification.classList.add(bgColor);
        iconElement.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 ${textColor}"></i>`;
        
        // 显示通知
        notification.classList.add('show');
        
        // 重新渲染Lucide图标
        lucide.createIcons();
        
        // 设置自动隐藏
        if (duration > 0) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = setTimeout(() => {
                this.hideNotification();
            }, duration);
        }
    },
    
    /**
     * 隐藏通知
     */
    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // 动画结束后完全隐藏
        setTimeout(() => {
            notification.classList.remove('hide');
        }, 300);
    },
    
    /**
     * 复制所有计算结果
     */
    copyAllResults() {
        if (FileHandler.calculationResults.length === 0) {
            this.showNotification('没有结果', '没有可复制的计算结果', 'warning');
            return;
        }
        
        let textToCopy = '';
        
        FileHandler.calculationResults.forEach(result => {
            textToCopy += `文件名: ${result.filename}\n`;
            textToCopy += `文件大小: ${Utils.formatFileSize(result.size)}\n`;
            
            Object.entries(result.hashValues).forEach(([algorithm, hash]) => {
                textToCopy += `${algorithm.toUpperCase()}: ${hash}\n`;
            });
            
            textToCopy += '\n';
        });
        
        Utils.copyToClipboard(textToCopy).then(success => {
            if (success) {
                this.showNotification('复制成功', '已复制所有计算结果', 'success');
            } else {
                this.showNotification('复制失败', '无法复制结果，请手动复制', 'error');
            }
        });
    },
    
    /**
     * 打开导出弹窗
     */
    openExportModal() {
        if (FileHandler.calculationResults.length === 0) {
            this.showNotification('没有结果', '没有可导出的计算结果', 'warning');
            return;
        }
        
        // 设置默认文件名
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        document.getElementById('export-filename').value = `hash_results_${dateStr}_${timeStr}`;
        
        // 设置默认格式
        document.getElementById('export-format-modal').value = SettingsManager.get('exportFormat');
        
        // 显示弹窗
        document.getElementById('export-modal').classList.remove('hidden');
    },
    
    /**
     * 关闭导出弹窗
     */
    closeExportModal() {
        document.getElementById('export-modal').classList.add('hidden');
    },
    
    /**
     * 导出计算结果
     */
    exportResults() {
        if (FileHandler.calculationResults.length === 0) {
            this.showNotification('没有结果', '没有可导出的计算结果', 'warning');
            return;
        }
        
        // 获取文件名和格式
        const filename = document.getElementById('export-filename').value || 'hash_results';
        const format = document.getElementById('export-format-modal').value;
        const includeTimestamp = document.getElementById('include-timestamp').checked;
        
        let content, mimeType, extension;
        
        // 根据格式生成内容
        if (format === 'csv') {
            content = Utils.exportAsCsv(FileHandler.calculationResults, includeTimestamp);
            mimeType = 'text/csv;charset=utf-8;';
            extension = 'csv';
        } else {
            content = Utils.exportAsTxt(FileHandler.calculationResults, includeTimestamp);
            mimeType = 'text/plain;charset=utf-8;';
            extension = 'txt';
        }
        
        // 下载文件
        Utils.downloadFile(content, `${filename}.${extension}`, mimeType);
        
        // 关闭弹窗
        this.closeExportModal();
        
        // 显示成功通知
        this.showNotification('导出成功', `已导出 ${FileHandler.calculationResults.length} 个文件的哈希值`, 'success');
    },
    
    /**
     * 比较用户输入的哈希值与计算结果
     */
    compareHash() {
        const inputHash = document.getElementById('compare-hash-input').value.trim();
        
        if (!inputHash) {
            this.showNotification('请输入哈希值', '请输入要比较的哈希值', 'warning');
            return;
        }
        
        if (FileHandler.calculationResults.length === 0) {
            this.showNotification('没有计算结果', '请先计算文件的哈希值', 'warning');
            return;
        }
        
        const comparisonResult = document.getElementById('comparison-result');
        comparisonResult.innerHTML = '';
        
        // 查找匹配的哈希值
        let foundMatch = false;
        const matches = [];
        
        FileHandler.calculationResults.forEach(result => {
            Object.entries(result.hashValues).forEach(([algorithm, hash]) => {
                if (Utils.compareHashes(inputHash, hash)) {
                    foundMatch = true;
                    matches.push({
                        filename: result.filename,
                        algorithm,
                        hash
                    });
                }
            });
        });
        
        // 显示比较结果
        if (foundMatch) {
            // 找到匹配
            comparisonResult.className = 'p-4 rounded-lg comparison-match border';
            
            const matchIcon = document.createElement('i');
            matchIcon.className = 'w-6 h-6 text-green-500 inline-block mr-2';
            matchIcon.setAttribute('data-lucide', 'check-circle');
            
            const matchTitle = document.createElement('h3');
            matchTitle.className = 'font-medium text-green-600 dark:text-green-400 flex items-center mb-2';
            matchTitle.appendChild(matchIcon);
            matchTitle.appendChild(document.createTextNode('找到匹配的哈希值'));
            
            const matchList = document.createElement('ul');
            matchList.className = 'space-y-2';
            
            matches.forEach(match => {
                const listItem = document.createElement('li');
                listItem.className = 'flex flex-col sm:flex-row sm:items-center justify-between';
                
                const fileInfo = document.createElement('div');
                fileInfo.className = 'flex items-center';
                
                const fileIcon = document.createElement('i');
                fileIcon.className = 'w-4 h-4 mr-2 text-gray-500';
                fileIcon.setAttribute('data-lucide', FileHandler.getFileIcon(''));
                
                const fileName = document.createElement('span');
                fileName.textContent = match.filename;
                
                fileInfo.appendChild(fileIcon);
                fileInfo.appendChild(fileName);
                
                const algoInfo = document.createElement('span');
                algoInfo.className = 'text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-0';
                algoInfo.textContent = `${match.algorithm.toUpperCase()}`;
                
                listItem.appendChild(fileInfo);
                listItem.appendChild(algoInfo);
                matchList.appendChild(listItem);
            });
            
            comparisonResult.appendChild(matchTitle);
            comparisonResult.appendChild(matchList);
        } else {
            // 没有找到匹配
            comparisonResult.className = 'p-4 rounded-lg comparison-mismatch border';
            
            const mismatchIcon = document.createElement('i');
            mismatchIcon.className = 'w-6 h-6 text-red-500 inline-block mr-2';
            mismatchIcon.setAttribute('data-lucide', 'x-circle');
            
            const mismatchTitle = document.createElement('h3');
            mismatchTitle.className = 'font-medium text-red-600 dark:text-red-400 flex items-center mb-2';
            mismatchTitle.appendChild(mismatchIcon);
            mismatchTitle.appendChild(document.createTextNode('未找到匹配的哈希值'));
            
            const mismatchText = document.createElement('p');
            mismatchText.className = 'text-sm';
            mismatchText.textContent = '输入的哈希值与任何计算结果都不匹配';
            
            comparisonResult.appendChild(mismatchTitle);
            comparisonResult.appendChild(mismatchText);
        }
        
        comparisonResult.classList.remove('hidden');
        
        // 重新渲染Lucide图标
        lucide.createIcons();
    }
};