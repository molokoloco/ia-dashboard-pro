const express = require('express');
const router = express.Router();
const db = require('../db');

const TYPES = ['article', 'cv', 'candidature', 'site', 'script', 'design', 'general'];

router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const type = req.query.type;
  if (type && TYPES.includes(type)) {
    res.json(db.prepare('SELECT * FROM actions WHERE type=? ORDER BY created_at DESC LIMIT ?').all(type, limit));
  } else {
    res.json(db.prepare('SELECT * FROM actions ORDER BY created_at DESC LIMIT ?').all(limit));
  }
});

router.post('/', (req, res) => {
  const { type, description, context } = req.body;
  if (!description?.trim()) return res.status(400).json({ error: 'description required' });
  const result = db.prepare(
    'INSERT INTO actions (type, description, context) VALUES (?, ?, ?)'
  ).run(type || 'general', description.trim(), context || '');
  res.json(db.prepare('SELECT * FROM actions WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM actions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
