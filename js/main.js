/**
 * 文件哈希计算器主入口文件
 * 负责初始化各个模块和启动应用
 */

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各个模块
    SettingsManager.init();
    FileHandler.init();
    UI.init();
    
    // 渲染Lucide图标
    lucide.createIcons();
    
    // 显示欢迎通知
    setTimeout(() => {
        UI.showNotification('欢迎使用', '文件哈希计算器已就绪，您可以开始计算文件哈希值了', 'info', 5000);
    }, 500);
});