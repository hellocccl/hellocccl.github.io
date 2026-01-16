// 主题切换功能
const themeManager = {
    // 初始化主题
    init() {
        // 检查localStorage中保存的主题，如果没有则使用系统偏好
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // 检测系统偏好
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        // 更新切换按钮图标
        this.updateToggleButton();
    },
    
    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateToggleButton();
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    },
    
    // 切换主题
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },
    
    // 获取当前主题
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    
    // 更新切换按钮图标
    updateToggleButton() {
        const buttons = document.querySelectorAll('.theme-toggle-btn i');
        const theme = this.getCurrentTheme();
        
        buttons.forEach(btn => {
            if (theme === 'dark') {
                btn.className = 'bi bi-sun-fill';
                btn.setAttribute('title', typeof i18n !== 'undefined' ? i18n.t('theme.lightMode') : '切换到浅色模式');
            } else {
                btn.className = 'bi bi-moon-fill';
                btn.setAttribute('title', typeof i18n !== 'undefined' ? i18n.t('theme.darkMode') : '切换到深色模式');
            }
        });
    }
};

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => themeManager.init());
} else {
    themeManager.init();
}

// 监听语言变化，更新按钮提示
window.addEventListener('languageChanged', () => {
    themeManager.updateToggleButton();
});
