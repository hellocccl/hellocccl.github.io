const site = (() => {
    const CONTENT_DIR = 'contents';
    const ARTICLES_FILE = `${CONTENT_DIR}/articles.json`;
    const CONFIG_FILE = `${CONTENT_DIR}/config.yml`;
    const cache = {
        config: null,
        articles: null
    };
    let baseInitPromise = null;

    function escapeHtml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function fetchText(path) {
        return fetch(path).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${path}`);
            }
            return response.text();
        });
    }

    function fetchJson(path) {
        return fetch(path).then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${path}`);
            }
            return response.json();
        });
    }

    function applyConfigValue(element, value) {
        if (value === undefined || value === null) {
            return;
        }

        const prefix = element.dataset.configPrefix || '';
        const suffix = element.dataset.configSuffix || '';
        const formattedValue = `${prefix}${value}${suffix}`;
        const targetAttr = element.dataset.configAttr;

        if (targetAttr) {
            element.setAttribute(targetAttr, formattedValue);
            return;
        }

        element.textContent = formattedValue;
    }

    function applyConfig(config) {
        document.querySelectorAll('[data-config]').forEach(element => {
            const key = element.dataset.config;
            applyConfigValue(element, config[key]);
        });
    }

    async function loadConfig() {
        if (cache.config) {
            return cache.config;
        }

        const text = await fetchText(CONFIG_FILE);
        cache.config = typeof jsyaml !== 'undefined' ? jsyaml.load(text) || {} : {};
        applyConfig(cache.config);
        return cache.config;
    }

    function sortArticles(articles) {
        return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async function loadArticles() {
        if (cache.articles) {
            return cache.articles;
        }

        const articles = await fetchJson(ARTICLES_FILE);
        cache.articles = sortArticles(articles);
        return cache.articles;
    }

    function setupNavbar() {
        const navbar = document.getElementById('mainNav');
        const navbarToggler = document.querySelector('.navbar-toggler');

        document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                    navbarToggler.click();
                }
            });
        });

        if (!navbar) {
            return;
        }

        const syncNavbarState = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 24);
        };

        syncNavbarState();
        window.addEventListener('scroll', syncNavbarState, { passive: true });
    }

    function setupBackToTop() {
        const button = document.getElementById('backToTop');
        if (!button) {
            return;
        }

        const syncButton = () => {
            button.classList.toggle('visible', window.scrollY > 420);
        };

        syncButton();
        window.addEventListener('scroll', syncButton, { passive: true });
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function setupScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) {
            return;
        }

        const update = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
    }

    function syncSiteVisits() {
        if (typeof analytics === 'undefined') {
            return;
        }

        const updateVisits = value => {
            document.querySelectorAll('[data-site-visits]').forEach(element => {
                element.textContent = analytics.formatNumber(value);
            });
        };

        updateVisits(analytics.getSiteVisits());
        window.addEventListener('siteVisitUpdated', event => {
            updateVisits(event.detail.visits);
        });
    }

    function formatDate(dateString) {
        if (!dateString) {
            return '';
        }

        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    function getAllTags(articles) {
        const tagMap = new Map();

        articles.forEach(article => {
            (article.tags || []).forEach(tag => {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            });
        });

        return [...tagMap.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([name, count]) => ({ name, count }));
    }

    function articleUrl(articleId) {
        return `article.html?article=${encodeURIComponent(articleId)}`;
    }

    function blogUrl(tag) {
        if (!tag) {
            return 'blog.html';
        }
        return `blog.html?tag=${encodeURIComponent(tag)}`;
    }

    function estimateReadingStats(markdown = '') {
        const text = markdown
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/`[^`]+`/g, ' ')
            .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/[#>*_\-\[\]\(\)!|]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishCount = (text.match(/[A-Za-z0-9_]+/g) || []).length;
        const words = chineseCount + englishCount;
        const minutes = Math.max(1, Math.ceil(chineseCount / 320 + englishCount / 220));

        return { words, minutes };
    }

    function renderMarkdown(markdown) {
        if (typeof marked === 'undefined') {
            return markdown;
        }

        marked.use({ mangle: false, headerIds: false });
        return marked.parse(markdown);
    }

    async function renderMarkdownInto(element, markdown) {
        element.innerHTML = renderMarkdown(markdown);

        if (typeof hljs !== 'undefined') {
            element.querySelectorAll('pre code').forEach(block => {
                try {
                    hljs.highlightElement(block);
                } catch (error) {
                    console.error('Syntax highlight failed:', error);
                }
            });
        }

        if (typeof MathJax !== 'undefined') {
            if (typeof MathJax.typesetPromise === 'function') {
                try {
                    await MathJax.typesetPromise([element]);
                } catch (error) {
                    console.error('MathJax render failed:', error);
                }
            } else if (typeof MathJax.typeset === 'function') {
                MathJax.typeset([element]);
            }
        }
    }

    function slugify(text, index) {
        const slug = text
            .trim()
            .toLowerCase()
            .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        return slug || `section-${index + 1}`;
    }

    function buildToc(container) {
        const headings = [...container.querySelectorAll('h2, h3')];

        return headings.map((heading, index) => {
            if (!heading.id) {
                heading.id = slugify(heading.textContent, index);
            }

            if (!heading.querySelector('.heading-anchor')) {
                const anchor = document.createElement('a');
                anchor.className = 'heading-anchor';
                anchor.href = `#${heading.id}`;
                anchor.setAttribute('aria-label', `Jump to ${heading.textContent}`);
                anchor.innerHTML = '<i class="bi bi-link-45deg"></i>';
                heading.appendChild(anchor);
            }

            return {
                id: heading.id,
                text: heading.textContent.trim(),
                level: heading.tagName.toLowerCase()
            };
        });
    }

    function createTagList(tags = [], options = {}) {
        const { linkable = false } = options;

        return (tags || []).map(tag => {
            const content = escapeHtml(tag);
            if (linkable) {
                return `<a class="tag-pill" href="${blogUrl(tag)}">${content}</a>`;
            }
            return `<span class="tag-pill">${content}</span>`;
        }).join('');
    }

    function createArticleCard(article, options = {}) {
        const { compact = false, showDescription = true } = options;
        const description = showDescription && article.description
            ? `<p class="article-card-description">${escapeHtml(article.description)}</p>`
            : '';

        return `
            <article class="article-card${compact ? ' article-card-compact' : ''}">
                <a class="article-card-link" href="${articleUrl(article.id)}">
                    <div class="article-card-top">
                        <span class="article-card-date"><i class="bi bi-calendar3"></i>${escapeHtml(formatDate(article.date))}</span>
                        <span class="article-card-arrow"><i class="bi bi-arrow-up-right"></i></span>
                    </div>
                    <h3>${escapeHtml(article.title)}</h3>
                    ${description}
                    <div class="tag-list">${createTagList(article.tags)}</div>
                </a>
            </article>
        `;
    }

    async function init() {
        if (!baseInitPromise) {
            baseInitPromise = (async () => {
                setupNavbar();
                setupBackToTop();
                setupScrollProgress();
                syncSiteVisits();
                try {
                    await loadConfig();
                } catch (error) {
                    console.error('Config load failed:', error);
                }
            })();
        }

        return baseInitPromise;
    }

    return {
        CONTENT_DIR,
        articleUrl,
        blogUrl,
        buildToc,
        createArticleCard,
        createTagList,
        escapeHtml,
        estimateReadingStats,
        fetchText,
        formatDate,
        getAllTags,
        init,
        loadArticles,
        loadConfig,
        renderMarkdown,
        renderMarkdownInto
    };
})();
