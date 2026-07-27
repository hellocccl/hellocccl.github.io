window.addEventListener('DOMContentLoaded', async () => {
    await site.init();

    try {
        const [config, articles, homeMarkdown, interestsMarkdown, awardsMarkdown] = await Promise.all([
            site.loadConfig(),
            site.loadArticles(),
            site.fetchText(`${site.CONTENT_DIR}/home.md`),
            site.fetchText(`${site.CONTENT_DIR}/interests.md`),
            site.fetchText(`${site.CONTENT_DIR}/awards.md`)
        ]);

        document.title = `${config.title || 'hellocccl'} | Engineering Blog`;

        await Promise.all([
            site.renderMarkdownInto(document.getElementById('home-md'), homeMarkdown),
            site.renderMarkdownInto(document.getElementById('interests-md'), interestsMarkdown),
            site.renderMarkdownInto(document.getElementById('awards-md'), awardsMarkdown)
        ]);

        renderHeroStats(articles);
        renderLatestPosts(articles);
        renderTopicCloud(articles);
        renderLatestSummary(articles);
    } catch (error) {
        console.error('Failed to load home content:', error);
    }
});

function renderHeroStats(articles) {
    const articleCount = document.getElementById('article-count');
    const tagCount = document.getElementById('tag-count');

    if (articleCount) {
        articleCount.textContent = articles.length;
    }

    if (tagCount) {
        tagCount.textContent = site.getAllTags(articles).length;
    }
}

function renderLatestPosts(articles) {
    const target = document.getElementById('latest-posts-list');
    if (!target) {
        return;
    }

    if (!articles.length) {
        target.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-journal-x"></i>
                <h3>No posts yet</h3>
                <p>The first published post will show up here automatically.</p>
            </div>
        `;
        return;
    }

    const latestArticles = articles.slice(0, 3);
    target.innerHTML = latestArticles.map(article => site.createArticleCard(article)).join('');
}

function renderTopicCloud(articles) {
    const target = document.getElementById('topic-cloud');
    if (!target) {
        return;
    }

    const tags = site.getAllTags(articles).slice(0, 10);
    if (!tags.length) {
        target.innerHTML = '<p class="articles-summary">No tags yet.</p>';
        return;
    }

    target.innerHTML = tags.map(tag => `
        <a class="topic-chip" href="${site.blogUrl(tag.name)}">
            <span>${site.escapeHtml(tag.name)}</span>
            <strong>${tag.count}</strong>
        </a>
    `).join('');
}

function renderLatestSummary(articles) {
    const latest = articles[0];
    const latestDate = document.getElementById('latest-post-date');
    const latestLink = document.getElementById('latest-post-link');

    if (!latest) {
        if (latestLink) {
            latestLink.textContent = 'Waiting for the first post';
            latestLink.href = 'blog.html';
        }
        return;
    }

    if (latestDate && latest) {
        latestDate.textContent = site.formatDate(latest.date);
    }

    if (latestLink && latest) {
        latestLink.textContent = latest.title;
        latestLink.href = site.articleUrl(latest.id);
    }
}
