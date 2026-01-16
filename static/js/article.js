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

    // 记录文章访问
    if (articleName && typeof analytics !== 'undefined') {
        const views = analytics.trackArticleView(articleName);
        const viewsEl = document.getElementById('article-views');
        if (viewsEl) {
            viewsEl.textContent = analytics.formatNumber(views);
        }
    }

    if (!articleName) {
        const lang = typeof i18n !== 'undefined' ? i18n.getCurrentLang() : 'zh';
        const notFoundMsg = lang === 'zh' ? '未找到文章' : 'Article not found';
        const backMsg = lang === 'zh' ? '返回文章列表' : 'Back to Articles';
        document.getElementById('article-content').innerHTML = 
            `<div class="text-center"><h3 data-i18n="article.notFound">${notFoundMsg}</h3><p><a href="blog.html" data-i18n="article.backToList">${backMsg}</a></p></div>`;
        if (typeof i18n !== 'undefined') {
            i18n.updatePage();
        }
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
            
            // 添加代码复制按钮
            addCopyButtonsToCodeBlocks();
            
            // 计算字数和阅读时间
            calculateWordCount(markdown);
            
            // 更新文章访问次数显示
            if (articleName && typeof analytics !== 'undefined') {
                const views = analytics.getArticleViews(articleName);
                const viewsEl = document.getElementById('article-views');
                if (viewsEl) {
                    viewsEl.textContent = analytics.formatNumber(views);
                }
            }
            
            // Extract title from markdown for page title
            const titleMatch = markdown.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                const lang = typeof i18n !== 'undefined' ? i18n.getCurrentLang() : 'zh';
                const suffix = lang === 'zh' ? ' - 技术文章' : ' - Technical Article';
                document.getElementById('article-title').textContent = titleMatch[1] + suffix;
            }
        })
        .then(() => {
            // MathJax
            MathJax.typeset();
        })
        .catch(error => {
            console.error('加载文章失败:', error);
            const lang = typeof i18n !== 'undefined' ? i18n.getCurrentLang() : 'zh';
            const errorMsg = lang === 'zh' ? '文章加载失败' : 'Failed to load article';
            const notFoundMsg = lang === 'zh' ? '文章 "' + articleName + '" 不存在。"' : 'Article "' + articleName + '" not found.';
            const backMsg = lang === 'zh' ? '返回文章列表' : 'Back to Articles';
            document.getElementById('article-content').innerHTML = 
                `<div class="text-center"><h3>${errorMsg}</h3><p>${notFoundMsg}</p><p><a href="blog.html" data-i18n="article.backToList">${backMsg}</a></p></div>`;
            if (typeof i18n !== 'undefined') {
                i18n.updatePage();
            }
        });

    // 监听语言变化事件
    window.addEventListener('languageChanged', () => {
        // 重新更新页面文本
        if (typeof i18n !== 'undefined') {
            i18n.updatePage();
        }
    });
    
    // 显示网站访问次数
    if (typeof analytics !== 'undefined') {
        const siteVisitsEl = document.getElementById('site-visits');
        if (siteVisitsEl) {
            const visits = analytics.getSiteVisits();
            siteVisitsEl.textContent = analytics.formatNumber(visits);
        }
        
        // 监听访问量更新事件
        window.addEventListener('siteVisitUpdated', (e) => {
            if (siteVisitsEl) {
                siteVisitsEl.textContent = analytics.formatNumber(e.detail.visits);
            }
        });
    }
});

// 添加代码复制按钮
function addCopyButtonsToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('#article-content pre code');
    codeBlocks.forEach((codeBlock, index) => {
        const pre = codeBlock.parentElement;
        if (pre.querySelector('.copy-code-btn')) {
            return; // 已经添加过按钮
        }
        
        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
        copyBtn.title = typeof i18n !== 'undefined' ? i18n.t('common.copyCode') : '复制代码';
        copyBtn.setAttribute('aria-label', typeof i18n !== 'undefined' ? i18n.t('common.copyCode') : '复制代码');
        
        // 设置按钮样式
        copyBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            z-index: 10;
        `;
        
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.background = '#e9ecef';
        });
        
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.background = '#f8f9fa';
        });
        
        // 复制功能
        copyBtn.addEventListener('click', async () => {
            const text = codeBlock.textContent;
            try {
                await navigator.clipboard.writeText(text);
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="bi bi-check"></i>';
                copyBtn.style.background = '#d4edda';
                copyBtn.style.borderColor = '#c3e6cb';
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.style.background = '#f8f9fa';
                    copyBtn.style.borderColor = '#dee2e6';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="bi bi-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            }
        });
        
        // 设置pre为相对定位
        pre.style.position = 'relative';
        pre.style.paddingTop = '40px';
        pre.appendChild(copyBtn);
    });
}

// 计算字数和阅读时间
function calculateWordCount(markdown) {
    // 移除markdown语法，只保留纯文本
    let text = markdown
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/`[^`]+`/g, '') // 移除行内代码
        .replace(/#+\s+/g, '') // 移除标题标记
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*([^*]+)\*/g, '$1') // 移除斜体标记
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接，保留文本
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '') // 移除图片
        .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
        .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
        .replace(/>\s+/g, '') // 移除引用标记
        .replace(/\n+/g, ' ') // 将换行符替换为空格
        .trim();
    
    // 中文字数统计（按字符数）
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;
    
    // 英文单词数
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const englishCount = englishWords.length;
    
    // 总字数（中文按字符，英文按单词）
    const totalWords = chineseCount + englishCount;
    
    // 预计阅读时间（中文按300字/分钟，英文按200词/分钟）
    const chineseTime = chineseCount / 300;
    const englishTime = englishCount / 200;
    const totalMinutes = Math.ceil(chineseTime + englishTime) || 1;
    
    // 显示统计信息
    const wordCountEl = document.getElementById('word-count');
    const readTimeEl = document.getElementById('read-time');
    const metaEl = document.getElementById('article-meta');
    
    if (wordCountEl && readTimeEl && metaEl) {
        wordCountEl.textContent = totalWords.toLocaleString();
        readTimeEl.textContent = totalMinutes;
        metaEl.style.display = 'block';
        
        // 更新i18n
        if (typeof i18n !== 'undefined') {
            i18n.updatePage();
        }
    }
}
