window.addEventListener('DOMContentLoaded', async () => {
    await site.init();

    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');

    if (!articleId) {
        renderArticleState({
            title: 'Article not found',
            description: 'This link has no article id. Head back to the post list and pick one.'
        });
        return;
    }

    try {
        const [config, articles, markdown] = await Promise.all([
            site.loadConfig(),
            site.loadArticles(),
            site.fetchText(`${site.CONTENT_DIR}/articles/${articleId}.md`)
        ]);

        const currentArticle = articles.find(article => article.id === articleId) || {
            id: articleId,
            title: extractTitle(markdown) || articleId,
            date: '',
            description: 'No extra description was found for this article in articles.json.',
            tags: []
        };

        document.title = `${currentArticle.title} | ${config.title || 'hellocccl'}`;
        renderArticleHeader(currentArticle, markdown);
        await site.renderMarkdownInto(document.getElementById('article-content'), markdown);
        enhanceArticleContent(currentArticle, articles);
    } catch (error) {
        console.error('Failed to load article:', error);
        renderArticleState({
            title: 'Failed to load article',
            description: `No article file was found for "${articleId}".`
        });
    }
});

function extractTitle(markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : '';
}

function renderArticleHeader(article, markdown) {
    const heading = document.getElementById('article-heading');
    const description = document.getElementById('article-description');
    const date = document.getElementById('article-date');
    const words = document.getElementById('word-count');
    const minutes = document.getElementById('read-time');
    const views = document.getElementById('article-views');
    const tags = document.getElementById('article-tags');
    const stats = site.estimateReadingStats(markdown);

    if (heading) {
        heading.textContent = article.title;
    }

    if (description) {
        description.textContent = article.description || 'Notes and thoughts from what I learn along the way.';
    }

    if (date) {
        date.textContent = site.formatDate(article.date);
    }

    if (words) {
        words.textContent = stats.words.toLocaleString('en-US');
    }

    if (minutes) {
        minutes.textContent = stats.minutes;
    }

    if (views && typeof analytics !== 'undefined') {
        views.textContent = analytics.formatNumber(analytics.trackArticleView(article.id));
    }

    if (tags) {
        tags.innerHTML = site.createTagList(article.tags, { linkable: true });
    }
}

function enhanceArticleContent(currentArticle, articles) {
    const content = document.getElementById('article-content');
    if (!content) {
        return;
    }

    addCopyButtonsToCodeBlocks(content);
    renderToc(content);
    renderRelatedArticles(currentArticle, articles);
}

function renderToc(content) {
    const tocContainer = document.getElementById('article-toc');
    const items = site.buildToc(content);

    if (!tocContainer) {
        return;
    }

    if (!items.length) {
        tocContainer.innerHTML = '<p class="toc-empty">No sections to build an outline from.</p>';
        return;
    }

    tocContainer.innerHTML = `
        <ul class="toc-list">
            ${items.map(item => `
                <li>
                    <a class="toc-link ${item.level}" href="#${item.id}" data-toc-link="${item.id}">
                        ${site.escapeHtml(item.text)}
                    </a>
                </li>
            `).join('')}
        </ul>
    `;

    const observer = new IntersectionObserver(entries => {
        const visibleEntry = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (!visibleEntry) {
            return;
        }

        document.querySelectorAll('[data-toc-link]').forEach(link => {
            link.classList.toggle('active', link.dataset.tocLink === visibleEntry.target.id);
        });
    }, {
        rootMargin: '-25% 0px -60% 0px',
        threshold: 0.1
    });

    items.forEach(item => {
        const heading = document.getElementById(item.id);
        if (heading) {
            observer.observe(heading);
        }
    });
}

function renderRelatedArticles(currentArticle, articles) {
    const target = document.getElementById('related-articles');
    if (!target) {
        return;
    }

    const currentTags = new Set(currentArticle.tags || []);
    const related = articles
        .filter(article => article.id !== currentArticle.id)
        .map(article => ({
            ...article,
            score: (article.tags || []).reduce((total, tag) => total + (currentTags.has(tag) ? 1 : 0), 0)
        }))
        .filter(article => article.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    if (!related.length) {
        target.innerHTML = `
            <div class="empty-state compact">
                <i class="bi bi-stars"></i>
                <p>No same-topic posts yet — browse the full list for more.</p>
            </div>
        `;
        return;
    }

    target.innerHTML = related.map(article => site.createArticleCard(article, {
        compact: true,
        showDescription: false
    })).join('');
}

function renderArticleState({ title, description }) {
    const heading = document.getElementById('article-heading');
    const descriptionEl = document.getElementById('article-description');
    const content = document.getElementById('article-content');
    const meta = document.getElementById('article-meta');
    const toc = document.getElementById('article-toc');
    const related = document.getElementById('related-articles');

    document.title = `${title} | hellocccl`;

    if (heading) {
        heading.textContent = title;
    }

    if (descriptionEl) {
        descriptionEl.textContent = description;
    }

    if (meta) {
        meta.style.display = 'none';
    }

    if (content) {
        content.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-x"></i>
                <h3>${site.escapeHtml(title)}</h3>
                <p>${site.escapeHtml(description)}</p>
                <a class="btn btn-outline-primary btn-pill" href="blog.html">Back to posts</a>
            </div>
        `;
    }

    if (toc) {
        toc.innerHTML = '<p class="toc-empty">Outline unavailable.</p>';
    }

    if (related) {
        related.innerHTML = '';
    }
}

function addCopyButtonsToCodeBlocks(container) {
    container.querySelectorAll('pre code').forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        if (!pre || pre.querySelector('.copy-code-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';

        button.addEventListener('click', async () => {
            const text = codeBlock.textContent;

            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    await navigator.clipboard.writeText(text);
                } else {
                    legacyCopyText(text);
                }
                button.classList.add('copied');
                button.innerHTML = '<i class="bi bi-check2"></i><span>Copied</span>';
                window.setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = '<i class="bi bi-clipboard"></i><span>Copy</span>';
                }, 1800);
            } catch (error) {
                console.error('Copy failed:', error);
            }
        });

        pre.classList.add('code-block');
        pre.appendChild(button);
    });
}

function legacyCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}
