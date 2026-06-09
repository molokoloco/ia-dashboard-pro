const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PROMPTS_DIR = path.join(__dirname, '../../../wiki/prompts');
const INDEX_FILE = path.join(PROMPTS_DIR, 'PROMPTS-INDEX.md');
const SKIP_FILES = new Set(['PROMPTS-INDEX.md', 'README.md']);

let indexCache = { mtime: 0, entries: [] };

function parseIndex() {
  const stat = fs.statSync(INDEX_FILE);
  if (stat.mtimeMs === indexCache.mtime) return indexCache.entries;

  const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
  const lines = raw.split('\n');
  const entries = [];
  const rowRe = /^\|\s*(\*\*)?([A-Z][A-Z0-9-]*\d+[a-z]?)(\*\*)?\s*\|\s*(\*\*)?(.+?)(\*\*)?\s*\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*\[.*?\]\(([^)]+)\)\s*\|$/;

  for (const line of lines) {
    const m = line.match(rowRe);
    if (!m) continue;
    const id = m[2].trim();
    const title = m[5].replace(/\*\*/g, '').replace(/\s*\(\+\d+\s*ex\)\s*$/, '').trim();
    const category = m[7].trim();
    const tagsCell = m[8];
    const link = m[9];
    const tags = [...tagsCell.matchAll(/`#([^`]+)`/g)].map(x => x[1]);

    const [filePart, anchorRaw = ''] = link.split('#');
    const file = decodeURIComponent(filePart);
    const anchor = decodeURIComponent(anchorRaw);

    entries.push({ id, title, category, tags, file, anchor });
  }

  indexCache = { mtime: stat.mtimeMs, entries };
  return entries;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function originalSlugify(text) {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[()[\].,!?:'"’“”]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function sliceSection(raw, anchor) {
  const lines = raw.split('\n');
  const headingRe = /^(#{2,4})\s+(.+?)\s*$/;
  let start = -1, startLevel = 0, end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headingRe);
    if (!m) continue;
    const cleaned = m[2].replace(/[`*]/g, '');
    const slugA = slugify(cleaned);
    const slugB = originalSlugify(cleaned);
    if (start === -1) {
      if (slugA === anchor || slugB === anchor || cleaned.toLowerCase().includes(anchor.toLowerCase().slice(0, 12))) {
        start = i; startLevel = m[1].length;
      }
    } else if (m[1].length <= startLevel) {
      end = i; break;
    }
  }
  return start === -1 ? '' : lines.slice(start, end).join('\n').trim();
}

router.get('/', (req, res) => {
  try {
    res.json(parseIndex());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json([]);
  try {
    const entries = parseIndex();
    const byFile = {};
    entries.forEach(e => { (byFile[e.file] = byFile[e.file] || []).push(e); });

    const results = [];
    for (const file of Object.keys(byFile)) {
      const fp = path.join(PROMPTS_DIR, file);
      if (!fs.existsSync(fp)) continue;
      const raw = fs.readFileSync(fp, 'utf-8');
      for (const entry of byFile[file]) {
        const section = sliceSection(raw, entry.anchor);
        const haystack = (entry.title + ' ' + entry.tags.join(' ') + ' ' + section).toLowerCase();
        const idx = haystack.indexOf(q);
        if (idx === -1) continue;
        const sectionLower = section.toLowerCase();
        const sectionIdx = sectionLower.indexOf(q);
        let snippet = '';
        if (sectionIdx !== -1) {
          const s = Math.max(0, sectionIdx - 60);
          const e = Math.min(section.length, sectionIdx + q.length + 90);
          snippet = (s > 0 ? '…' : '') + section.slice(s, e).replace(/\s+/g, ' ').trim() + (e < section.length ? '…' : '');
        } else {
          snippet = entry.title;
        }
        results.push({ ...entry, snippet });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const entries = parseIndex();
    const entry = entries.find(e => e.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not found' });

    const fp = path.join(PROMPTS_DIR, entry.file);
    if (!fs.existsSync(fp)) return res.status(404).json({ error: 'File not found' });
    const raw = fs.readFileSync(fp, 'utf-8');
    const section = sliceSection(raw, entry.anchor);
    if (!section) return res.status(404).json({ error: 'Section not found', anchor: entry.anchor });

    res.json({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      tags: entry.tags,
      file: entry.file,
      raw: section,
      html: marked(section),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
