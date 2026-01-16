// 访客统计功能
const analytics = {
    // 存储键名
    STORAGE_KEY_SITE_VISITS: 'blog_site_visits',
    STORAGE_KEY_ARTICLE_VIEWS: 'blog_article_views',
    
    // 初始化
    init() {
        this.trackSiteVisit();
    },
    
    // 记录网站访问
    trackSiteVisit() {
        let visits = parseInt(localStorage.getItem(this.STORAGE_KEY_SITE_VISITS) || '0', 10);
        visits += 1;
        localStorage.setItem(this.STORAGE_KEY_SITE_VISITS, visits.toString());
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('siteVisitUpdated', { 
            detail: { visits: visits } 
        }));
        
        return visits;
    },
    
    // 获取网站访问次数
    getSiteVisits() {
        return parseInt(localStorage.getItem(this.STORAGE_KEY_SITE_VISITS) || '0', 10);
    },
    
    // 记录文章访问
    trackArticleView(articleId) {
        if (!articleId) return 0;
        
        // 获取所有文章访问数据
        const allViews = this.getAllArticleViews();
        
        // 增加访问次数
        const currentViews = parseInt(allViews[articleId] || '0', 10);
        const newViews = currentViews + 1;
        allViews[articleId] = newViews;
        
        // 保存数据
        localStorage.setItem(this.STORAGE_KEY_ARTICLE_VIEWS, JSON.stringify(allViews));
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('articleViewUpdated', { 
            detail: { articleId: articleId, views: newViews } 
        }));
        
        return newViews;
    },
    
    // 获取文章访问次数
    getArticleViews(articleId) {
        if (!articleId) return 0;
        const allViews = this.getAllArticleViews();
        return parseInt(allViews[articleId] || '0', 10);
    },
    
    // 获取所有文章访问数据
    getAllArticleViews() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_ARTICLE_VIEWS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading article views:', e);
            return {};
        }
    },
    
    // 格式化数字（添加千分位）
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
};

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
    analytics.init();
}
