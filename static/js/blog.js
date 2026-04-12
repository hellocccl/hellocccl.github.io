let blogArticles = [];
const blogState = {
    query: '',
    tag: '全部'
};

window.addEventListener('DOMContentLoaded', async () => {
    await site.init();

    try {
        const [config, articles] = await Promise.all([
            site.loadConfig(),
            site.loadArticles()
        ]);

        blogArticles = articles;
        document.title = `${config.title || 'hellocccl'} | 技术文章`;

        initFilters(articles);
        renderBlogStats(articles);
        renderTagFilters(articles);
        renderArticles();
    } catch (error) {
        console.error('加载文章列表失败:', error);
        const target = document.getElementById('articles-list');
        if (target) {
            target.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-circle"></i>
                    <h3>文章列表加载失败</h3>
                    <p>请检查 <code>contents/articles.json</code> 是否可用。</p>
                </div>
            `;
        }
    }
});

function initFilters(articles) {
    const params = new URLSearchParams(window.location.search);
    blogState.tag = params.get('tag') || '全部';

    const searchInput = document.getElementById('article-search');
    const clearButton = document.getElementById('clear-filters');

    if (searchInput) {
        searchInput.addEventListener('input', event => {
            blogState.query = event.target.value.trim().toLowerCase();
            renderArticles();
        });
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            blogState.query = '';
            blogState.tag = '全部';
            if (searchInput) {
                searchInput.value = '';
            }
            renderTagFilters(articles);
            renderArticles();
            history.replaceState(null, '', 'blog.html');
        });
    }
}

function renderBlogStats(articles) {
    const totalCount = document.getElementById('blog-total-count');
    const totalTags = document.getElementById('blog-total-tags');
    const latestDate = document.getElementById('latest-post-date');

    if (totalCount) {
        totalCount.textContent = articles.length;
    }

    if (totalTags) {
        totalTags.textContent = site.getAllTags(articles).length;
    }

    if (latestDate && articles[0]) {
        latestDate.textContent = site.formatDate(articles[0].date);
    }
}

function renderTagFilters(articles) {
    const target = document.getElementById('tag-filters');
    if (!target) {
        return;
    }

    const tags = [{ name: '全部', count: articles.length }, ...site.getAllTags(articles)];

    target.innerHTML = tags.map(tag => `
        <button class="filter-chip${blogState.tag === tag.name ? ' active' : ''}" type="button" data-tag="${site.escapeHtml(tag.name)}">
            <span>${site.escapeHtml(tag.name)}</span>
            <strong>${tag.count}</strong>
        </button>
    `).join('');

    target.querySelectorAll('[data-tag]').forEach(button => {
        button.addEventListener('click', () => {
            blogState.tag = button.dataset.tag;
            renderTagFilters(articles);
            renderArticles();

            const nextUrl = blogState.tag === '全部' ? 'blog.html' : site.blogUrl(blogState.tag);
            history.replaceState(null, '', nextUrl);
        });
    });
}

function getFilteredArticles() {
    return blogArticles.filter(article => {
        const matchesTag = blogState.tag === '全部' || (article.tags || []).includes(blogState.tag);
        const haystack = [
            article.title,
            article.description,
            ...(article.tags || [])
        ].join(' ').toLowerCase();
        const matchesQuery = !blogState.query || haystack.includes(blogState.query);
        return matchesTag && matchesQuery;
    });
}

function renderArticles() {
    const target = document.getElementById('articles-list');
    const summary = document.getElementById('articles-summary');
    const filteredArticles = getFilteredArticles();

    if (summary) {
        summary.textContent = filteredArticles.length === blogArticles.length
            ? `共 ${blogArticles.length} 篇文章`
            : `筛选后还有 ${filteredArticles.length} 篇文章`;
    }

    if (!target) {
        return;
    }

    if (filteredArticles.length === 0) {
        target.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>没有找到匹配的文章</h3>
                <p>试试换一个关键词，或者清空筛选条件。</p>
            </div>
        `;
        return;
    }

    target.innerHTML = filteredArticles.map(article => site.createArticleCard(article)).join('');
}
