let blogArticles = [];
const ALL_TAG = 'all';
const blogState = {
    query: '',
    tag: ALL_TAG
};

window.addEventListener('DOMContentLoaded', async () => {
    await site.init();

    try {
        const [config, articles] = await Promise.all([
            site.loadConfig(),
            site.loadArticles()
        ]);

        blogArticles = articles;
        document.title = `${config.title || 'hellocccl'} | Posts`;

        initFilters(articles);
        renderBlogStats(articles);
        renderTagFilters(articles);
        renderArticles();
    } catch (error) {
        console.error('Failed to load post list:', error);
        const target = document.getElementById('articles-list');
        if (target) {
            target.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-exclamation-circle"></i>
                    <h3>Failed to load posts</h3>
                    <p>Check that <code>contents/articles.json</code> is available.</p>
                </div>
            `;
        }
    }
});

function initFilters(articles) {
    const params = new URLSearchParams(window.location.search);
    blogState.tag = params.get('tag') || ALL_TAG;

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
            blogState.tag = ALL_TAG;
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

    const tags = [{ name: ALL_TAG, count: articles.length }, ...site.getAllTags(articles)];

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

            const nextUrl = blogState.tag === ALL_TAG ? 'blog.html' : site.blogUrl(blogState.tag);
            history.replaceState(null, '', nextUrl);
        });
    });
}

function getFilteredArticles() {
    return blogArticles.filter(article => {
        const matchesTag = blogState.tag === ALL_TAG || (article.tags || []).includes(blogState.tag);
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
            ? `${blogArticles.length} posts`
            : `${filteredArticles.length} of ${blogArticles.length} posts`;
    }

    if (!target) {
        return;
    }

    if (filteredArticles.length === 0) {
        target.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>No matching posts</h3>
                <p>Try a different keyword, or clear the filters.</p>
            </div>
        `;
        return;
    }

    target.innerHTML = filteredArticles.map(article => site.createArticleCard(article)).join('');
}
