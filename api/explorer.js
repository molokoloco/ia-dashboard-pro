// api/explorer.js
// Liste le répertoire de travail + ouvre dans l'explorateur Windows
// ⚠️  LOCAL USE ONLY — designed to run on your own machine, not exposed to the internet.

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const { exec } = require('child_process');
const cfg = require('../config');

// GET /api/explorer/config — retourne la config des types de dossiers
router.get('/config', (req, res) => {
  res.json(cfg.explorerDirs || {});
});

const ROOT = path.resolve(__dirname, '..', '..');
const IGNORE = new Set(['node_modules', 'desktop.ini', '.git', '.claude', 'package-lock.json']);

function statEntry(fullPath, name) {
  try {
    const stat = fs.statSync(fullPath);
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

function readDir(dirPath) {
  try {
    return fs.readdirSync(dirPath)
      .filter(n => !IGNORE.has(n) && !n.startsWith('.'))
      .map(n => statEntry(path.join(dirPath, n), n))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  } catch { return []; }
}

// GET /api/explorer — liste racine
router.get('/', (req, res) => {
  const p = req.query.path || ROOT;
  const entries = readDir(p);
  res.json({ root: ROOT, path: p, entries });
});

// GET /api/explorer/children?path= — sous-dossier
router.get('/children', (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });
  res.json({ path: resolvedP, entries: readDir(resolvedP) });
});

// GET /api/explorer/read?path= — lit un fichier texte (md, json, js…)
router.get('/read', (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  const resolvedP = path.resolve(p);
  if (!resolvedP.toLowerCase().startsWith(ROOT.toLowerCase())) return res.status(403).json({ error: 'Accès refusé' });
  try {
    const content = fs.readFileSync(resolvedP, 'utf8');
    res.json({ path: resolvedP, name: path.basename(resolvedP), content });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/explorer/save — enregistre un fichier
router.post('/save', (req, res) => {
  const { path: p, content } = req.body;
  if (!p) return res.status(400).json({ error: 'path requis' });
  if (!path.resolve(p).startsWith(ROOT)) return res.status(403).json({ error: 'Accès refusé' });
  
  try {
    fs.writeFileSync(p, content, 'utf8');
    res.json({ ok: true, path: p, size: content.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/explorer/open?path= — ouvre dans Explorer Windows
router.get('/open', (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: 'path requis' });
  if (!path.resolve(p).startsWith(ROOT)) return res.status(403).json({ error: 'Accès refusé' });

  const stat = fs.existsSync(p) ? fs.statSync(p) : null;
  // Si c'est un fichier, ouvre le dossier parent en sélectionnant le fichier
  const cmd = stat && stat.isFile()
    ? `explorer /select,"${p.replace(/\//g, '\\')}"`
    : `explorer "${p.replace(/\//g, '\\')}"`;

  exec(cmd, err => {
    if (err && !err.message.includes('ENOENT')) console.warn('explorer:', err.message);
    res.json({ ok: true, cmd });
  });
});

module.exports = router;
