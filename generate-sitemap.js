// 生成 sitemap.xml 的脚本
// 使用方法: node generate-sitemap.js

const fs = require('fs');
const path = require('path');

// 配置
const baseUrl = 'https://hellocccl.github.io'; // 请修改为你的实际域名
const articlesFile = path.join(__dirname, 'contents', 'articles.json');
const sitemapFile = path.join(__dirname, 'sitemap.xml');

// 读取文章列表
let articles = [];
try {
    const articlesData = fs.readFileSync(articlesFile, 'utf8');
    articles = JSON.parse(articlesData);
} catch (error) {
    console.error('读取文章列表失败:', error.message);
    articles = [];
}

// 生成 sitemap.xml
const urls = [
    {
        loc: baseUrl,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '1.0'
    },
    {
        loc: `${baseUrl}/blog.html`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: '0.8'
    }
];

// 添加文章URL
articles.forEach(article => {
    urls.push({
        loc: `${baseUrl}/article.html?article=${article.id}`,
        lastmod: article.date || new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.6'
    });
});

// 生成XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// 写入文件
try {
    fs.writeFileSync(sitemapFile, xml, 'utf8');
    console.log('✅ sitemap.xml 生成成功!');
    console.log(`   共生成 ${urls.length} 个URL`);
    console.log(`   文件位置: ${sitemapFile}`);
} catch (error) {
    console.error('❌ 生成 sitemap.xml 失败:', error.message);
    process.exit(1);
}
