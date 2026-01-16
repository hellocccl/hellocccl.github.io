// 国际化支持
const i18n = {
    currentLang: localStorage.getItem('language') || 'zh',
    translations: {},
    
    async init() {
        try {
            const response = await fetch('contents/i18n.json');
            this.translations = await response.json();
            this.setLanguage(this.currentLang);
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    },
    
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language ${lang} not found`);
            return;
        }
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
        this.updatePage();
    },
    
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    },
    
    updatePage() {
        // 更新所有带有 data-i18n 属性的元素
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        
        // 更新所有带有 data-i18n-placeholder 属性的元素
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        
        // 触发自定义事件，通知其他脚本语言已更改
        window.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: this.currentLang } 
        }));
    },
    
    getCurrentLang() {
        return this.currentLang;
    }
};

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}
