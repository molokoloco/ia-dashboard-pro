const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const WIKI_BASE = path.join(__dirname, '../../wiki');

async function parseFile(filepath) {
  const raw = await fs.readFile(filepath, 'utf-8');
  const { data: meta, content: body } = matter(raw);
  return { meta, body };
}

router.get('/', async (req, res) => {
  const articles = [];
  const pages = [];

  const articlesDir = path.join(WIKI_BASE, 'articles');
  const pagesDir = path.join(WIKI_BASE, 'pages');

  try {
    const articlesExist = await fs.access(articlesDir).then(() => true).catch(() => false);
    if (articlesExist) {
      const files = await fs.readdir(articlesDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      for (const f of mdFiles) {
        const fileSlug = f.replace('.md', '');
        const { meta } = await parseFile(path.join(articlesDir, f));
        const wpSlug = meta.slug || fileSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
        articles.push({ ...meta, slug: fileSlug, wpSlug, type: 'article' });
      }
      articles.sort((a, b) => (b.slug > a.slug ? 1 : -1));
    }

    const pagesExist = await fs.access(pagesDir).then(() => true).catch(() => false);
    if (pagesExist) {
      const files = await fs.readdir(pagesDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      
      for (const f of mdFiles) {
        const { meta } = await parseFile(path.join(pagesDir, f));
        pages.push({ slug: f.replace('.md', ''), type: 'page', ...meta });
      }
    }

    res.json({ articles, pages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/articles/:slug', async (req, res) => {
  const articlesDir = path.join(WIKI_BASE, 'articles');
  const filepath = path.join(articlesDir, req.params.slug + '.md');
  const resolvedPath = path.resolve(filepath);

  if (!resolvedPath.startsWith(articlesDir)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { meta, body } = await parseFile(resolvedPath);
    res.json({ meta, html: marked(body) });
  } catch (e) {
    res.status(404).json({ error: 'Not found' });
  }
});

router.get('/pages/:slug', async (req, res) => {
  const pagesDir = path.join(WIKI_BASE, 'pages');
  const filepath = path.join(pagesDir, req.params.slug + '.md');
  const resolvedPath = path.resolve(filepath);

  if (!resolvedPath.startsWith(pagesDir)) {
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
