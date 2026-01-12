const content_dir = 'contents/'
const articles_dir = content_dir + 'articles/'
const config_file = 'config.yml'

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

    // Get article name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const articleName = urlParams.get('article');

    if (!articleName) {
        document.getElementById('article-content').innerHTML = 
            '<div class="text-center"><h3>未找到文章</h3><p><a href="blog.html">返回文章列表</a></p></div>';
        return;
    }

    // Load article
    marked.use({ mangle: false, headerIds: false })
    fetch(articles_dir + articleName + '.md')
        .then(response => {
            if (!response.ok) {
                throw new Error('文章未找到');
            }
            return response.text();
        })
        .then(markdown => {
            const html = marked.parse(markdown);
            document.getElementById('article-content').innerHTML = html;
            
            // Extract title from markdown for page title
            const titleMatch = markdown.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                document.getElementById('article-title').textContent = titleMatch[1] + ' - 技术文章';
            }
        })
        .then(() => {
            // MathJax
            MathJax.typeset();
        })
        .catch(error => {
            console.error('加载文章失败:', error);
            document.getElementById('article-content').innerHTML = 
                '<div class="text-center"><h3>文章加载失败</h3><p>文章 "' + articleName + '" 不存在。</p><p><a href="blog.html">返回文章列表</a></p></div>';
        });

});
