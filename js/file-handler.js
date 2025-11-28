/**
 * 文件处理模块
 * 负责文件拖拽、选择和处理功能
 */

// 文件处理器对象
const FileHandler = {
    // 当前选中的文件列表
    selectedFiles: [],
    
    // 计算结果列表
    calculationResults: [],
    
    /**
     * 初始化文件处理器
     */
    init() {
        this.setupEventListeners();
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const dropArea = document.getElementById('drop-area');
        const fileInput = document.getElementById('file-input');
        const calculateBtn = document.getElementById('calculate-btn');
        const clearBtn = document.getElementById('clear-btn');
        const fileSelectLabel = dropArea.querySelector('label'); // 获取选择文件按钮

        // 拖拽事件
        dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dropArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 点击选择文件
        dropArea.addEventListener('click', () => fileInput.click());
        fileSelectLabel.addEventListener('click', (e) => e.stopPropagation()); // 阻止事件冒泡
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 计算和清除按钮
        calculateBtn.addEventListener('click', () => this.startCalculation());
        clearBtn.addEventListener('click', () => this.clearFiles());
    },
    
    /**
     * 处理拖拽经过事件
     * @param {DragEvent} e - 拖拽事件对象
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('drop-area').classList.add('drag-over');
    },
    
    /**
     * 处理拖拽离开事件
     * @param {DragEvent} e - 拖拽事件对象
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('drop-area').classList.remove('drag-over');
    },
    
    /**
     * 处理文件拖放事件
     * @param {DragEvent} e - 拖拽事件对象
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const dropArea = document.getElementById('drop-area');
        dropArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            this.processFiles(Array.from(e.dataTransfer.files));
        }
    },
    
    /**
     * 处理文件选择事件
     * @param {Event} e - 文件选择事件对象
     */
    handleFileSelect(e) {
        if (e.target.files && e.target.files.length > 0) {
            this.processFiles(Array.from(e.target.files));
        }
    },
    
    /**
     * 处理选中的文件
     * @param {Array<File>} files - 文件数组
     */
    processFiles(files) {
        // 检查是否有文件被选择
        if (files.length === 0) return;
        
        // 更新选中的文件列表
        this.selectedFiles = files;
        
        // 显示文件列表
        this.displayFileList();
        
        // 启用计算按钮
        document.getElementById('calculate-btn').disabled = false;
        
        // 如果启用了自动计算，直接开始计算
        if (SettingsManager.get('autoCalculate')) {
            this.startCalculation();
        }
    },
    
    /**
     * 显示选中的文件列表
     */
    displayFileList() {
        const fileListContainer = document.getElementById('file-list');
        const selectedFilesList = document.getElementById('selected-files');
        
        // 清空现有列表
        selectedFilesList.innerHTML = '';
        
        // 添加每个文件到列表
        this.selectedFiles.forEach((file, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors';
            
            // 文件图标和名称
            const fileInfo = document.createElement('div');
            fileInfo.className = 'flex items-center overflow-hidden';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'w-4 h-4 mr-2 text-gray-500';
            fileIcon.setAttribute('data-lucide', this.getFileIcon(file.type));
            
            const fileName = document.createElement('span');
            fileName.className = 'truncate max-w-[200px] sm:max-w-[300px]';
            fileName.textContent = file.name;
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            
            // 文件大小
            const fileSize = document.createElement('span');
            fileSize.className = 'text-xs text-gray-500 ml-2 whitespace-nowrap';
            fileSize.textContent = Utils.formatFileSize(file.size);
            
            listItem.appendChild(fileInfo);
            listItem.appendChild(fileSize);
            selectedFilesList.appendChild(listItem);
        });
        
        // 显示文件列表容器
        fileListContainer.classList.remove('hidden');
        
        // 重新渲染Lucide图标
        lucide.createIcons();
    },
    
    /**
     * 根据文件类型获取对应的图标
     * @param {string} fileType - 文件MIME类型
     * @returns {string} Lucide图标名称
     */
    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) {
            return 'image';
        } else if (fileType.startsWith('text/')) {
            return 'file-text';
        } else if (fileType.startsWith('application/pdf')) {
            return 'file-pdf';
        } else if (fileType.startsWith('application/zip') || fileType.startsWith('application/x-rar-compressed')) {
            return 'file-zip';
        } else if (fileType.startsWith('audio/')) {
            return 'music';
        } else if (fileType.startsWith('video/')) {
            return 'film';
        } else {
            return 'file';
        }
    },
    
    /**
     * 开始计算哈希值
     */
    async startCalculation() {
        // 获取选中的算法
        const selectedAlgorithms = this.getSelectedAlgorithms();
        
        // 检查是否选择了算法
        if (selectedAlgorithms.length === 0) {
            UI.showNotification('请选择算法', '请至少选择一种哈希算法', 'warning');
            return;
        }
        
        // 检查是否选择了文件
        if (this.selectedFiles.length === 0) {
            UI.showNotification('请选择文件', '请先选择要计算哈希值的文件', 'warning');
            return;
        }
        
        // 清空之前的结果
        this.calculationResults = [];
        
        // 显示进度条
        const progressContainer = document.getElementById('progress-container');
        progressContainer.classList.remove('hidden');
        
        // 隐藏结果区域
        document.getElementById('results-section').classList.add('hidden');
        
        // 禁用计算按钮
        document.getElementById('calculate-btn').disabled = true;
        
        try {
            // 逐个计算文件的哈希值
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                
                // 更新进度条标题
                document.getElementById('progress-file-name').textContent = file.name;
                
                // 计算哈希值
                const result = await HashCalculator.calculateMultipleHashes(file, selectedAlgorithms, {
                    onProgress: (progress) => this.updateProgress(progress, file.size)
                });
                
                // 添加到结果列表
                this.calculationResults.push(result);
            }
            
            // 显示结果
            this.displayResults();
            
            // 显示成功通知
            UI.showNotification('计算完成', `成功计算了 ${this.selectedFiles.length} 个文件的哈希值`, 'success');
            
            // 如果有多个文件，自动进行比较
            if (this.selectedFiles.length > 1) {
                this.compareMultipleFiles();
            }
        } catch (error) {
            console.error('计算哈希值失败:', error);
            UI.showNotification('计算失败', `计算哈希值时出错: ${error.message}`, 'error');
        } finally {
            // 隐藏进度条
            progressContainer.classList.add('hidden');
            
            // 重新启用计算按钮
            document.getElementById('calculate-btn').disabled = false;
        }
    },
    
    /**
     * 更新进度条
     * @param {Object} progress - 进度信息
     * @param {number} totalSize - 文件总大小
     */
    updateProgress(progress, totalSize) {
        const { processed, percentage } = progress;
        
        // 更新进度条宽度
        document.getElementById('progress-value').style.width = `${percentage}%`;
        
        // 更新百分比文本
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        
        // 更新大小信息
        document.getElementById('progress-size').textContent = `${Utils.formatFileSize(processed)} / ${Utils.formatFileSize(totalSize)}`;
        
        // 更新剩余时间
        const startTime = this.calculationStartTime || Date.now();
        this.calculationStartTime = startTime;
        const remainingTime = Utils.calculateRemainingTime(processed, totalSize, startTime);
        document.getElementById('progress-time').textContent = `剩余时间：${remainingTime}`;
    },
    
    /**
     * 显示计算结果
     */
    displayResults() {
        const resultsContainer = document.getElementById('results-container');
        resultsContainer.innerHTML = '';
        
        // 为每个文件创建结果卡片
        this.calculationResults.forEach((result, index) => {
            const card = document.createElement('div');
            card.className = 'card result-card';
            
            // 卡片头部
            const cardHeader = document.createElement('div');
            cardHeader.className = 'flex justify-between items-center mb-4';
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'flex items-center';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'w-5 h-5 mr-2 text-primary';
            fileIcon.setAttribute('data-lucide', this.getFileIcon(this.selectedFiles[index].type));
            
            const fileName = document.createElement('h3');
            fileName.className = 'font-medium truncate max-w-[200px] sm:max-w-[400px]';
            fileName.textContent = result.filename;
            
            fileInfo.appendChild(fileIcon);
            fileInfo.appendChild(fileName);
            
            const fileSize = document.createElement('span');
            fileSize.className = 'text-sm text-gray-500';
            fileSize.textContent = Utils.formatFileSize(result.size);
            
            cardHeader.appendChild(fileInfo);
            cardHeader.appendChild(fileSize);
            
            // 哈希值列表
            const hashList = document.createElement('div');
            hashList.className = 'space-y-3';
            
            Object.entries(result.hashValues).forEach(([algorithm, hash]) => {
                const hashItem = document.createElement('div');
                hashItem.className = 'flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg';
                
                const algoName = document.createElement('span');
                algoName.className = 'font-medium text-sm mb-1 sm:mb-0';
                algoName.textContent = algorithm.toUpperCase();
                
                const hashValue = document.createElement('div');
                hashValue.className = 'flex items-center';
                
                const hashText = document.createElement('code');
                hashText.className = 'text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono overflow-x-auto max-w-full';
                hashText.textContent = hash;
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'ml-2 p-1.5 text-gray-500 hover:text-primary transition-colors';
                copyBtn.setAttribute('title', '复制哈希值');
                copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
                copyBtn.addEventListener('click', () => {
                    Utils.copyToClipboard(hash).then(success => {
                        if (success) {
                            UI.showNotification('复制成功', `已复制 ${algorithm.toUpperCase()} 哈希值`, 'success');
                        } else {
                            UI.showNotification('复制失败', '无法复制哈希值，请手动复制', 'error');
                        }
                    });
                });
                
                hashValue.appendChild(hashText);
                hashValue.appendChild(copyBtn);
                
                hashItem.appendChild(algoName);
                hashItem.appendChild(hashValue);
                hashList.appendChild(hashItem);
            });
            
            // 卡片底部
            const cardFooter = document.createElement('div');
            cardFooter.className = 'mt-4 text-xs text-gray-500 flex justify-between items-center';
            
            const duration = document.createElement('span');
            duration.textContent = `计算时间: ${result.duration} ms`;
            
            const timestamp = document.createElement('span');
            timestamp.textContent = Utils.formatTimestamp(Date.now());
            
            cardFooter.appendChild(duration);
            cardFooter.appendChild(timestamp);
            
            // 组装卡片
            card.appendChild(cardHeader);
            card.appendChild(hashList);
            card.appendChild(cardFooter);
            resultsContainer.appendChild(card);
        });
        
        // 显示结果区域
        document.getElementById('results-section').classList.remove('hidden');
        
        // 重新渲染Lucide图标
        lucide.createIcons();
    },
    
    /**
     * 获取选中的算法
     * @returns {Array<string>} 选中的算法数组
     */
    getSelectedAlgorithms() {
        const checkboxes = document.querySelectorAll('.algorithm-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    },
    
    /**
     * 清除选中的文件
     */
    clearFiles() {
        // 清空文件列表
        this.selectedFiles = [];
        this.calculationResults = [];
        
        // 隐藏文件列表和结果区域
        document.getElementById('file-list').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        
        // 重置文件输入
        document.getElementById('file-input').value = '';
        
        // 禁用计算按钮
        document.getElementById('calculate-btn').disabled = true;
        
        // 隐藏进度条
        document.getElementById('progress-container').classList.add('hidden');
        
        // 清除多文件比较结果
        document.getElementById('multi-file-comparison-result').classList.add('hidden');
    },
    
    /**
     * 比较多个文件的哈希值
     */
    compareMultipleFiles() {
        if (this.calculationResults.length < 2) return;
        
        const comparisonResult = document.getElementById('multi-file-comparison-result');
        comparisonResult.innerHTML = '';
        comparisonResult.classList.remove('hidden');
        
        // 获取所有使用的算法
        const algorithms = new Set();
        this.calculationResults.forEach(result => {
            Object.keys(result.hashValues).forEach(algo => algorithms.add(algo));
        });
        
        // 为每个算法创建比较结果
        algorithms.forEach(algorithm => {
            const algoSection = document.createElement('div');
            algoSection.className = 'mb-4';
            
            const algoTitle = document.createElement('h3');
            algoTitle.className = 'font-medium text-primary mb-2';
            algoTitle.textContent = `${algorithm.toUpperCase()} 比较结果`;
            
            // 检查是否有相同哈希值的文件组
            const hashGroups = {};
            
            this.calculationResults.forEach(result => {
                const hash = result.hashValues[algorithm];
                if (!hashGroups[hash]) {
                    hashGroups[hash] = [];
                }
                hashGroups[hash].push(result.filename);
            });
            
            // 创建比较结果列表
            const comparisonList = document.createElement('div');
            comparisonList.className = 'space-y-2';
            
            // 检查是否所有文件都相同
            const allSame = Object.keys(hashGroups).length === 1;
            
            if (allSame) {
                // 所有文件都相同
                const sameItem = document.createElement('div');
                sameItem.className = 'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg';
                
                const sameIcon = document.createElement('i');
                sameIcon.className = 'w-5 h-5 text-green-500 inline-block mr-2';
                sameIcon.setAttribute('data-lucide', 'check-circle');
                
                const sameText = document.createElement('span');
                sameText.textContent = '所有文件的哈希值都相同，文件内容一致';
                
                sameItem.appendChild(sameIcon);
                sameItem.appendChild(sameText);
                comparisonList.appendChild(sameItem);
            } else {
                // 文件有不同
                Object.entries(hashGroups).forEach(([hash, files]) => {
                    const groupItem = document.createElement('div');
                    groupItem.className = 'p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg';
                    
                    const filesList = document.createElement('div');
                    filesList.className = 'mb-2';
                    
                    const filesTitle = document.createElement('span');
                    filesTitle.className = 'font-medium text-sm';
                    filesTitle.textContent = files.length > 1 ? '以下文件内容相同：' : '文件：';
                    
                    filesList.appendChild(filesTitle);
                    
                    const filesListItems = document.createElement('ul');
                    filesListItems.className = 'list-disc list-inside text-sm mt-1 space-y-1';
                    
                    files.forEach(file => {
                        const listItem = document.createElement('li');
                        listItem.textContent = file;
                        filesListItems.appendChild(listItem);
                    });
                    
                    filesList.appendChild(filesListItems);
                    
                    const hashValue = document.createElement('div');
                    hashValue.className = 'flex items-center mt-2';
                    
                    const hashLabel = document.createElement('span');
                    hashLabel.className = 'text-sm text-gray-600 dark:text-gray-400 mr-2';
                    hashLabel.textContent = '哈希值：';
                    
                    const hashText = document.createElement('code');
                    hashText.className = 'text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono';
                    hashText.textContent = hash;
                    
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'ml-2 p-1.5 text-gray-500 hover:text-primary transition-colors';
                    copyBtn.setAttribute('title', '复制哈希值');
                    copyBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
                    copyBtn.addEventListener('click', () => {
                        Utils.copyToClipboard(hash).then(success => {
                            if (success) {
                                UI.showNotification('复制成功', `已复制哈希值`, 'success');
                            } else {
                                UI.showNotification('复制失败', '无法复制哈希值，请手动复制', 'error');
                            }
                        });
                    });
                    
                    hashValue.appendChild(hashLabel);
                    hashValue.appendChild(hashText);
                    hashValue.appendChild(copyBtn);
                    
                    groupItem.appendChild(filesList);
                    groupItem.appendChild(hashValue);
                    comparisonList.appendChild(groupItem);
                });
            }
            
            algoSection.appendChild(algoTitle);
            algoSection.appendChild(comparisonList);
            comparisonResult.appendChild(algoSection);
        });
        
        // 重新渲染Lucide图标
        lucide.createIcons();
    }
};