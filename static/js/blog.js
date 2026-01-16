const content_dir = 'contents/'
const config_file = 'config.yml'
const articles_file = content_dir + 'articles.json'

let allArticles = [];

window.addEventListener('DOMContentLoaded', event => {

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Load config
    fetch(content_dir + config_file)
        .then(response => response.text())
        .then(text => {
            const yml = jsyaml.load(text);
            Object.keys(yml).forEach(key => {
                try {
                    const element = document.getElementById(key);
                    if (element) {
                        element.innerHTML = yml[key];
                    }
                } catch {
                    console.log("Unknown id and value: " + key + "," + yml[key].toString())
                }
            })
        })
        .catch(error => console.log(error));

    // Load articles list
    fetch(articles_file)
        .then(response => {
            if (!response.ok) {
                throw new Error('无法加载文章列表');
            }
            return response.json();
        })
        .then(articles => {
            allArticles = articles;
            displayArticles(articles);
            
            // 添加搜索功能
            const searchInput = document.getElementById('article-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase().trim();
                    if (query === '') {
                        displayArticles(allArticles);
                    } else {
                        const filtered = allArticles.filter(article => {
                            const titleMatch = article.title.toLowerCase().includes(query);
                            const descMatch = article.description.toLowerCase().includes(query);
                            const tagsMatch = article.tags.some(tag => tag.toLowerCase().includes(query));
                            return titleMatch || descMatch || tagsMatch;
                        });
                        displayArticles(filtered);
                    }
                });
            }
        })
        .catch(error => {
            console.error('加载文章列表失败:', error);
            document.getElementById('articles-list').innerHTML = `
                <div class="col-lg-10 mx-auto">
                    <div class="text-center">
                        <p>加载文章列表失败，请检查 articles.json 文件是否存在。</p>
                    </div>
                </div>
            `;
        });

    // 监听语言变化事件
    window.addEventListener('languageChanged', () => {
        if (allArticles.length > 0) {
            displayArticles(allArticles);
        }
    });
});

function displayArticles(articles) {
    const articlesList = document.getElementById('articles-list');
    
    if (articles.length === 0) {
        articlesList.innerHTML = `
            <div class="col-lg-10 mx-auto">
                <div class="text-center">
                    <p data-i18n="blog.noResults">未找到相关文章</p>
                </div>
            </div>
        `;
        // 更新i18n
        if (typeof i18n !== 'undefined') {
            i18n.updatePage();
        }
        return;
    }

    // Sort articles by date (newest first)
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Generate HTML for each article
    const articlesHTML = articles.map(article => {
        const tagsHTML = article.tags.map(tag => 
            `<span>${tag}</span>`
        ).join('');

        return `
            <div class="col-lg-10 mx-auto">
                <div class="article-item">
                    <a href="article.html?article=${article.id}">
                        <h3>${article.title}</h3>
                        <div class="article-meta">
                            <i class="bi bi-calendar3"></i> ${article.date}
                        </div>
                        <div class="article-description">
                            ${article.description}
                        </div>
                        <div class="article-tags">
                            ${tagsHTML}
                        </div>
                    </a>
                </div>
            </div>
        `;
    }).join('');

    articlesList.innerHTML = articlesHTML;
}
