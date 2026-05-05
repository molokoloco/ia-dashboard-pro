const express = require('express');
const router  = express.Router();
const fs      = require('fs').promises;
const path    = require('path');
const { exec } = require('child_process');
const cfg = require('../config');

// GET /api/explorer/config — retourne la config des types de dossiers
router.get('/config', (req, res) => {
  res.json(cfg.explorerDirs || {});
});

const ROOT = path.resolve(__dirname, '..', '..');
const IGNORE = new Set(['node_modules', 'desktop.ini', '.git', '.claude', 'package-lock.json']);

async function statEntry(fullPath, name) {
  try {
    const stat = await fs.stat(fullPath);
    return {
      name,
      path: fullPath,
      type: stat.isDirectory() ? 'dir' : 'file',
      ext: stat.isDirectory() ? '' : path.extname(name).toLowerCase(),
      size: stat.isDirectory() ? null : stat.size,
      mtime: stat.mtime.toISOString(),
    };
  } catch { return null; }
}

async function readDir(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    const filtered = files.filter(n => !IGNORE.has(n) && !n.startsWith('.'));
    const entries = await Promise.all(filtered.map(n => statEntry(path.join(dirPath, n), n)));
    return entries.filter(Boolean)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  } catch { return []; }
}

// GET /api/explorer — liste racine
router.get('/', async (req, res) => {
  const p = req.query.path || ROOT;
  const entries = await readDir(p);
  res.json({ root: ROOT, path: p, entries });
});

// GET /api/explorer/children?path= — sous-dossier
router.get('/children', async (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });
  res.json({ path: resolvedP, entries: await readDir(resolvedP) });
});

// GET /api/explorer/read?path= — lit un fichier texte (md, json, js…)
router.get('/read', async (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });
  try {
    const content = await fs.readFile(resolvedP, 'utf8');
    res.json({ path: resolvedP, name: path.basename(resolvedP), content });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/explorer/save — enregistre un fichier
router.post('/save', async (req, res) => {
  const { path: p, content } = req.body;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });
  
  try {
    await fs.writeFile(resolvedP, content, 'utf8');
    res.json({ ok: true, path: resolvedP, size: content.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/explorer/open?path= — ouvre dans Explorer Windows
router.get('/open', async (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });

  try {
    const stat = await fs.stat(resolvedP);
    const cmd = stat.isFile()
      ? `explorer /select,"${resolvedP.replace(/\//g, '\\')}"`
      : `explorer "${resolvedP.replace(/\//g, '\\')}"`;

    exec(cmd, err => {
      if (err && !err.message.includes('ENOENT')) console.warn('explorer:', err.message);
      res.json({ ok: true, cmd });
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
