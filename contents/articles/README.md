# 技术文章目录

这个目录用于存放所有的技术文章 Markdown 文件。

## 如何添加新文章

### 步骤 1：创建文章 Markdown 文件

在此目录下创建一个新的 `.md` 文件，例如 `my-article.md`，文件名将作为文章的唯一标识符（ID）。

### 步骤 2：编写文章内容

在文件中编写你的文章内容，使用 Markdown 格式。建议格式：

```markdown
# 文章标题

**发布日期：** YYYY-MM-DD  
**标签：** 标签1、标签2

文章正文内容...

---

[← 返回文章列表](blog.html)
```

### 步骤 3：在 articles.json 中注册文章

打开 `contents/articles.json` 文件，添加新文章的元数据：

```json
{
  "id": "my-article",
  "title": "我的新文章",
  "date": "2024-03-01",
  "tags": ["标签1", "标签2"],
  "description": "文章简介..."
}
```

**注意：**
- `id` 必须与 Markdown 文件名（不含扩展名）一致
- `date` 格式为 YYYY-MM-DD
- `tags` 是字符串数组
- 文章会按照日期倒序排列（最新的在前）

## 示例

参考 `vim.md` 和 `example2.md` 文件了解文章格式。
