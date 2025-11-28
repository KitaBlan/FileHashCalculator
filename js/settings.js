/**
 * 设置管理模块
 * 负责处理用户设置的保存、加载和应用
 */

// 默认设置
const DEFAULT_SETTINGS = {
    autoCalculate: false,
    chunkSize: 524288, // 512 KB
    resultFormat: 'lowercase',
    exportFormat: 'txt',
    theme: 'light' // 'light' 或 'dark'
};

// 设置管理对象
const SettingsManager = {
    // 当前设置
    currentSettings: { ...DEFAULT_SETTINGS },
    
    /**
     * 初始化设置
     */
    init() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
    },
    
    /**
     * 从localStorage加载设置
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('hashCalculatorSettings');
            if (savedSettings) {
                this.currentSettings = {
                    ...DEFAULT_SETTINGS,
                    ...JSON.parse(savedSettings)
                };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
            // 如果加载失败，使用默认设置
            this.currentSettings = { ...DEFAULT_SETTINGS };
        }
    },
    
    /**
     * 保存设置到localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('hashCalculatorSettings', JSON.stringify(this.currentSettings));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    },
    
    /**
     * 应用当前设置
     */
    applySettings() {
        // 应用主题设置
        this.applyTheme(this.currentSettings.theme);
        
        // 应用自动计算设置
        document.getElementById('auto-calculate').checked = this.currentSettings.autoCalculate;
        
        // 应用分块大小设置
        document.getElementById('chunk-size').value = this.currentSettings.chunkSize.toString();
        
        // 应用结果格式设置
        document.getElementById('result-format').value = this.currentSettings.resultFormat;
        
        // 应用导出格式设置
        document.getElementById('export-format').value = this.currentSettings.exportFormat;
        document.getElementById('export-format-modal').value = this.currentSettings.exportFormat;
    },
    
    /**
     * 应用主题设置
     * @param {string} theme - 主题名称 ('light' 或 'dark')
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },
    
    /**
     * 切换主题
     */
    toggleTheme() {
        const newTheme = this.currentSettings.theme === 'dark' ? 'light' : 'dark';
        this.currentSettings.theme = newTheme;
        this.applyTheme(newTheme);
        this.saveSettings();
    },
    
    /**
     * 获取当前设置值
     * @param {string} key - 设置键名
     * @returns {*} 设置值
     */
    get(key) {
        return this.currentSettings[key];
    },
    
    /**
     * 设置新的设置值
     * @param {string} key - 设置键名
     * @param {*} value - 设置值
     */
    set(key, value) {
        this.currentSettings[key] = value;
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 设置按钮点击事件
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        // 关闭设置弹窗
        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeSettingsModal();
        });
        
        // 保存设置
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveUserSettings();
        });
        
        // 主题切换按钮
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // 点击弹窗外部关闭弹窗
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.closeSettingsModal();
            }
        });
    },
    
    /**
     * 打开设置弹窗
     */
    openSettingsModal() {
        // 更新弹窗中的设置值
        document.getElementById('auto-calculate').checked = this.currentSettings.autoCalculate;
        document.getElementById('chunk-size').value = this.currentSettings.chunkSize.toString();
        document.getElementById('result-format').value = this.currentSettings.resultFormat;
        document.getElementById('export-format').value = this.currentSettings.exportFormat;
        
        // 显示弹窗
        document.getElementById('settings-modal').classList.remove('hidden');
    },
    
    /**
     * 关闭设置弹窗
     */
    closeSettingsModal() {
        document.getElementById('settings-modal').classList.add('hidden');
    },
    
    /**
     * 保存用户设置
     */
    saveUserSettings() {
        // 获取表单中的设置值
        this.currentSettings.autoCalculate = document.getElementById('auto-calculate').checked;
        this.currentSettings.chunkSize = parseInt(document.getElementById('chunk-size').value, 10);
        this.currentSettings.resultFormat = document.getElementById('result-format').value;
        this.currentSettings.exportFormat = document.getElementById('export-format').value;
        
        // 保存设置
        if (this.saveSettings()) {
            // 显示成功通知
            UI.showNotification('设置已保存', '您的设置已成功保存', 'success');
        } else {
            // 显示错误通知
            UI.showNotification('保存失败', '无法保存设置，请检查浏览器存储权限', 'error');
        }
        
        // 关闭弹窗
        this.closeSettingsModal();
    }
};