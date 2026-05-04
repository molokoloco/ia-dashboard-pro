const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM todos ORDER BY done ASC, priority DESC, created_at DESC').all());
});

router.post('/', (req, res) => {
  const { title, priority } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title required' });
  const result = db.prepare(
    'INSERT INTO todos (title, priority) VALUES (?, ?)'
  ).run(title.trim(), priority || 'normal');
  res.json(db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { done, title, priority } = req.body;
  db.prepare(
    'UPDATE todos SET done=?, title=?, priority=? WHERE id=?'
  ).run(done ? 1 : 0, title, priority || 'normal', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM todos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
