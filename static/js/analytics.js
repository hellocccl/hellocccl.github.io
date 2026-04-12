const analytics = {
    STORAGE_KEY_SITE_VISITS: 'blog_site_visits',
    STORAGE_KEY_ARTICLE_VIEWS: 'blog_article_views',
    SESSION_KEY_SITE_VISIT: 'blog_site_visit_session',
    SESSION_KEY_ARTICLE_VIEWS: 'blog_article_view_session',

    init() {
        this.trackSiteVisit();
    },

    trackSiteVisit() {
        if (sessionStorage.getItem(this.SESSION_KEY_SITE_VISIT)) {
            const existingVisits = this.getSiteVisits();
            window.dispatchEvent(new CustomEvent('siteVisitUpdated', {
                detail: { visits: existingVisits }
            }));
            return existingVisits;
        }

        let visits = parseInt(localStorage.getItem(this.STORAGE_KEY_SITE_VISITS) || '0', 10);
        visits += 1;
        localStorage.setItem(this.STORAGE_KEY_SITE_VISITS, visits.toString());
        sessionStorage.setItem(this.SESSION_KEY_SITE_VISIT, '1');

        window.dispatchEvent(new CustomEvent('siteVisitUpdated', {
            detail: { visits }
        }));

        return visits;
    },

    getSiteVisits() {
        return parseInt(localStorage.getItem(this.STORAGE_KEY_SITE_VISITS) || '0', 10);
    },

    getViewedArticlesInSession() {
        try {
            const data = sessionStorage.getItem(this.SESSION_KEY_ARTICLE_VIEWS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading session article views:', error);
            return [];
        }
    },

    markArticleViewedInSession(articleId) {
        const viewed = this.getViewedArticlesInSession();
        if (!viewed.includes(articleId)) {
            viewed.push(articleId);
            sessionStorage.setItem(this.SESSION_KEY_ARTICLE_VIEWS, JSON.stringify(viewed));
        }
    },

    trackArticleView(articleId) {
        if (!articleId) {
            return 0;
        }

        const viewedArticles = this.getViewedArticlesInSession();
        if (viewedArticles.includes(articleId)) {
            const currentViews = this.getArticleViews(articleId);
            window.dispatchEvent(new CustomEvent('articleViewUpdated', {
                detail: { articleId, views: currentViews }
            }));
            return currentViews;
        }

        const allViews = this.getAllArticleViews();
        const currentViews = parseInt(allViews[articleId] || '0', 10);
        const newViews = currentViews + 1;
        allViews[articleId] = newViews;
        localStorage.setItem(this.STORAGE_KEY_ARTICLE_VIEWS, JSON.stringify(allViews));
        this.markArticleViewedInSession(articleId);

        window.dispatchEvent(new CustomEvent('articleViewUpdated', {
            detail: { articleId, views: newViews }
        }));

        return newViews;
    },

    getArticleViews(articleId) {
        if (!articleId) {
            return 0;
        }

        const allViews = this.getAllArticleViews();
        return parseInt(allViews[articleId] || '0', 10);
    },

    getAllArticleViews() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY_ARTICLE_VIEWS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading article views:', error);
            return {};
        }
    },

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
};

window.addEventListener('DOMContentLoaded', () => analytics.init());
