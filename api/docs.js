const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const cfg = require('../config');

const BASE = path.join(__dirname, '../..');

const FILES       = cfg.docsFiles       || [];
const DYNAMIC_DIRS = cfg.docsDynamicDirs || [];
const PDF_DIRS    = cfg.docsPdfDirs     || [];

function extractMeta(content, rel) {
  // Titre : première ligne # Heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/[⬡🌐✍️📋]/g, '').trim() : path.basename(rel, '.md');

  // Description : premier blockquote > ou première phrase non vide après le titre
  const blockquote = content.match(/^>\s*(.+)$/m);
  let description = '';
  if (blockquote) {
    description = blockquote[1].trim();
  } else {
    // Première ligne non vide après le titre
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'));
    if (lines[0]) description = lines[0].replace(/\*\*/g, '').slice(0, 120);
  }

  // Mots-clés extraits du contenu (premiers H2)
  const h2s = [...content.matchAll(/^##\s+(.+)$/gm)].slice(0, 4).map(m => m[1].replace(/[^\w\sàâéèêëîïôùûü\-]/g, '').trim());

  return { title, description, h2s };
}

router.get('/', (req, res) => {
  // Fichiers manuels
  const manual = FILES.map(({ rel, tags }) => {
    const filepath = path.join(BASE, rel);
    if (!fs.existsSync(filepath)) return null;
    const stat = fs.statSync(filepath);
    const content = fs.readFileSync(filepath, 'utf-8');
    const { title, description, h2s } = extractMeta(content, rel);
    return { 
      slug: rel.replace(/\//g, '__').replace('.md', ''), 
      rel, 
      title, 
      description, 
      tags, 
      h2s, 
      type: 'md',
      url: `/workspace/${rel}`,
      modified: stat.mtime, 
      section: 'Références' 
    };
  }).filter(Boolean);

  // PDFs dans Julien-ia
  const pdfs = [];
  for (const { dir, tags: baseTags } of PDF_DIRS) {
    const dirPath = path.join(BASE, dir);
    if (!fs.existsSync(dirPath)) continue;
    fs.readdirSync(dirPath)
      .filter(f => /\.pdf$/i.test(f))
      .forEach(f => {
        const stat = fs.statSync(path.join(dirPath, f));
        pdfs.push({
          slug: `${dir}__${f.replace('.pdf','')}`.replace(/[^a-zA-Z0-9_\-]/g, '_'),
          rel: `${dir}/${f}`,
          title: f.replace('.pdf', ''),
          description: '',
          tags: baseTags,
          type: 'pdf',
          url: `/workspace/${dir}/${encodeURIComponent(f)}`,
          modified: stat.mtime,
          section: dir,
        });
      });
  }

  // Dossiers dynamiques (.md)
  const dynamic = [];
  for (const { dir, tags: baseTags } of DYNAMIC_DIRS) {
    const dirPath = path.join(BASE, dir);
    if (!fs.existsSync(dirPath)) continue;
    fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.md'))
      .forEach(f => {
        const rel = `${dir}/${f}`;
        const filepath = path.join(dirPath, f);
        const stat = fs.statSync(filepath);
        const content = fs.readFileSync(filepath, 'utf-8');
        const { title, description, h2s } = extractMeta(content, rel);
        dynamic.push({ 
          slug: rel.replace(/\//g, '__').replace('.md', ''), 
          rel, 
          title, 
          description, 
          tags: baseTags, 
          h2s, 
          type: 'md',
          url: `/workspace/${rel}`,
          modified: stat.mtime, 
          section: dir 
        });
      });
  }
  dynamic.sort((a, b) => new Date(b.modified) - new Date(a.modified));

  res.json([...manual, ...pdfs, ...dynamic]);
});

router.get('/:slug', (req, res) => {
  const rel = req.params.slug.replace(/__/g, '/') + '.md';
  const filepath = path.join(BASE, rel);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });

  const content = fs.readFileSync(filepath, 'utf-8');
  const { title, description } = extractMeta(content, rel);
  const entry = FILES.find(f => f.rel === rel);

  res.json({
    title,
    description,
    tags: entry?.tags || [],
    html: marked(content),
  });
});

module.exports = router;
