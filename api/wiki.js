const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const WIKI_BASE = path.join(__dirname, '../../wiki');

function parseFile(filepath) {
  const raw = fs.readFileSync(filepath, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  let meta = {};
  let body = raw;
  if (match) {
    body = match[2];
    match[1].split('\n').forEach(line => {
      const colon = line.indexOf(':');
      if (colon === -1) return;
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    });
  }
  return { meta, body };
}

router.get('/', (req, res) => {
  const articles = [];
  const pages = [];

  const articlesDir = path.join(WIKI_BASE, 'articles');
  const pagesDir = path.join(WIKI_BASE, 'pages');

  if (fs.existsSync(articlesDir)) {
    fs.readdirSync(articlesDir)
      .filter(f => f.endsWith('.md'))
      .forEach(f => {
        const fileSlug = f.replace('.md', ''); // "2026-03-05_mon-article"
        const { meta } = parseFile(path.join(articlesDir, f));
        // wpSlug = slug WP (depuis meta, ou déduit du nom de fichier)
        const wpSlug = meta.slug || fileSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
        articles.push({ ...meta, slug: fileSlug, wpSlug, type: 'article' });
      });
    articles.sort((a, b) => (b.slug > a.slug ? 1 : -1));
  }

  if (fs.existsSync(pagesDir)) {
    fs.readdirSync(pagesDir)
      .filter(f => f.endsWith('.md'))
      .forEach(f => {
        const { meta } = parseFile(path.join(pagesDir, f));
        pages.push({ slug: f.replace('.md', ''), type: 'page', ...meta });
      });
  }

  res.json({ articles, pages });
});

router.get('/articles/:slug', (req, res) => {
  const filepath = path.join(WIKI_BASE, 'articles', req.params.slug + '.md');
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  const { meta, body } = parseFile(filepath);
  res.json({ meta, html: marked(body) });
});

router.get('/pages/:slug', (req, res) => {
  const filepath = path.join(WIKI_BASE, 'pages', req.params.slug + '.md');
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  const { meta, body } = parseFile(filepath);
  res.json({ meta, html: marked(body) });
});

module.exports = router;
