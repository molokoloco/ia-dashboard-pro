const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../sessions-log.json');

function readLog() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8')); }
  catch (e) { return []; }
}

function writeLog(entries) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf-8');
}

// GET toutes les sessions
router.get('/', (req, res) => {
  const entries = readLog();
  res.json(entries.slice().reverse()); // plus récent en premier
});

// POST nouvelle session
router.post('/', (req, res) => {
  const { title, summary, actions, files } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });

  const entries = readLog();
  const now = new Date();
  const id = now.toISOString().slice(0, 10) + '-' + String(entries.filter(e => e.id.startsWith(now.toISOString().slice(0, 10))).length + 1).padStart(3, '0');

  const entry = {
    id,
    date: now.toISOString(),
    title: title.trim(),
    summary: summary?.trim() || '',
    actions: Array.isArray(actions) ? actions : (actions ? [actions] : []),
    files: Array.isArray(files) ? files : [],
  };

  entries.push(entry);
  writeLog(entries);
  res.json(entry);
});

// DELETE une session
router.delete('/:id', (req, res) => {
  const entries = readLog().filter(e => e.id !== req.params.id);
  writeLog(entries);
  res.json({ ok: true });
});

module.exports = router;
