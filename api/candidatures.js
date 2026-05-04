const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const OFFRES_DIR = path.join(__dirname, '../../Offres');

// Sync PDF files from disk to DB on startup
function syncOffres() {
  if (!fs.existsSync(OFFRES_DIR)) return;
  fs.readdirSync(OFFRES_DIR)
    .filter(f => /\.pdf$/i.test(f))
    .forEach(f => {
      const exists = db.prepare('SELECT id FROM candidatures WHERE filename = ?').get(f);
      if (!exists) {
        db.prepare('INSERT INTO candidatures (filename) VALUES (?)').run(f);
      }
    });
}
syncOffres();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM candidatures ORDER BY updated_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { filename, company, role, status, note } = req.body;
  const result = db.prepare(
    'INSERT INTO candidatures (filename, company, role, status, note) VALUES (?, ?, ?, ?, ?)'
  ).run(filename || '', company || '', role || '', status || 'envoyée', note || '');
  res.json(db.prepare('SELECT * FROM candidatures WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { company, role, status, note } = req.body;
  db.prepare(
    `UPDATE candidatures SET company=?, role=?, status=?, note=?, updated_at=datetime('now','localtime') WHERE id=?`
  ).run(company || '', role || '', status || 'envoyée', note || '', req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM candidatures WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
