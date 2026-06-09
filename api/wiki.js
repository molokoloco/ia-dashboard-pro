const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const JULIENWEB_ARTICLES_DIR = path.resolve('D:/Google Drive/_WWW_/Julienweb.fr/content/articles-publies');

async function parseFile(filepath) {
  const raw = await fs.readFile(filepath, 'utf-8');
  const { data: meta, content: body } = matter(raw);
  return { meta, body };
}

router.get('/', async (req, res) => {
  const articles = [];

  try {
    const exists = await fs.access(JULIENWEB_ARTICLES_DIR).then(() => true).catch(() => false);
    if (exists) {
      const files = await fs.readdir(JULIENWEB_ARTICLES_DIR);
      const mdFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}_.+\.md$/.test(f));

      for (const f of mdFiles) {
        const fileSlug = f.replace('.md', '');
        const { meta } = await parseFile(path.join(JULIENWEB_ARTICLES_DIR, f));
        const wpSlug = meta.slug || fileSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
        articles.push({ ...meta, slug: fileSlug, wpSlug, type: 'article' });
      }
      articles.sort((a, b) => (b.slug > a.slug ? 1 : -1));
    }

    res.json({ articles, pages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/articles/:slug', async (req, res) => {
  const filepath = path.join(JULIENWEB_ARTICLES_DIR, req.params.slug + '.md');
  const resolvedPath = path.resolve(filepath);

  if (!resolvedPath.startsWith(JULIENWEB_ARTICLES_DIR)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { meta, body } = await parseFile(resolvedPath);
    res.json({ meta, html: marked(body) });
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

module.exports = router;
