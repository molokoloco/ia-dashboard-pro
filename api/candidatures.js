const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Source de vérité : dossiers datés du projet cv (YYYY-MM-DD_entreprise_poste/)
// Déplacé 2026-06-25 : cv/ vit désormais dans coffre-fort-admin (chemin absolu, cross-dossier).
const CAND_DIR = 'D:/Google Drive/MON ENTREPRISE/coffre-fort-admin/cv/candidatures';
const DATED = /^\d{4}-\d{2}-\d{2}_/;

// Mini-parseur de frontmatter YAML (lignes `key: value` entre les deux ---)
function parseFrontmatter(md) {
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z_]+)\s*:\s*(.+)$/);
    if (mm) out[mm[1].trim()] = mm[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function titleize(slug) {
  return (slug || '').replace(/-/g, ' ').replace(/\b\w/gu, c => c.toUpperCase());
}

function pickFile(files, candidates) {
  for (const c of candidates) {
    if (typeof c === 'string') { if (files.includes(c)) return c; }
    else { const f = files.find(x => c.test(x)); if (f) return f; }
  }
  return null;
}

// Overlay statut SQLite : 1 ligne par dossier (colonne filename = slug)
function statusRow(slug, company, role) {
  let row = db.prepare('SELECT * FROM candidatures WHERE filename = ?').get(slug);
  if (!row) {
    const r = db.prepare(
      'INSERT INTO candidatures (filename, company, role, status) VALUES (?, ?, ?, ?)'
    ).run(slug, company, role, 'brouillon');
    row = db.prepare('SELECT * FROM candidatures WHERE id = ?').get(r.lastInsertRowid);
  }
  return row;
}

function scanCandidatures() {
  if (!fs.existsSync(CAND_DIR)) return [];
  const out = [];
  for (const slug of fs.readdirSync(CAND_DIR)) {
    if (!DATED.test(slug)) continue; // skip _test et non-datés
    const dir = path.join(CAND_DIR, slug);
    if (!fs.statSync(dir).isDirectory()) continue;

    const files = fs.readdirSync(dir);
    const [date, companySlug, ...roleParts] = slug.split('_');
    let company = titleize(companySlug);
    let role = titleize(roleParts.join(' '));
    let lieu = '', contrat = '', salaire = '', source = '';

    if (files.includes('offre.md')) {
      const fm = parseFrontmatter(fs.readFileSync(path.join(dir, 'offre.md'), 'utf8'));
      if (fm.entreprise) company = fm.entreprise;
      if (fm.poste) role = fm.poste;
      lieu = fm.lieu || '';
      contrat = fm.contrat || '';
      salaire = fm.salaire || '';
      source = fm.source || fm.source_alt || '';
    }

    const base = `/static/cv/candidatures/${encodeURIComponent(slug)}/`;
    const fileUrl = f => (f ? base + encodeURIComponent(f) : null);
    const cvFile = pickFile(files, [/^CV-.*\.pdf$/i, 'cv.pdf', 'cv.html']);
    const lettreFile = pickFile(files, ['lettre.pdf', 'lettre.html', 'lettre.md']);
    const offreFile = files.includes('offre.md') ? 'offre.md' : null;

    const row = statusRow(slug, company, role);

    out.push({
      id: row.id,
      slug,
      date,
      company,
      role,
      lieu, contrat, salaire, source,
      cvUrl: fileUrl(cvFile),
      lettreUrl: fileUrl(lettreFile),
      offreUrl: fileUrl(offreFile),
      status: row.status || 'brouillon',
      note: row.note || '',
      updated_at: row.updated_at,
    });
  }
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

router.get('/', (req, res) => {
  res.json(scanCandidatures());
});

// Ajout manuel (conservé)
router.post('/', (req, res) => {
  const { filename, company, role, status, note } = req.body;
  const result = db.prepare(
    'INSERT INTO candidatures (filename, company, role, status, note) VALUES (?, ?, ?, ?, ?)'
  ).run(filename || '', company || '', role || '', status || 'brouillon', note || '');
  res.json(db.prepare('SELECT * FROM candidatures WHERE id = ?').get(result.lastInsertRowid));
});

// PUT partiel : ne touche que les champs fournis (préserve la note quand on change le statut)
router.put('/:id', (req, res) => {
  const allowed = ['company', 'role', 'status', 'note'];
  const sets = [];
  const vals = [];
  for (const f of allowed) {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(req.body[f]); }
  }
  if (!sets.length) return res.json({ ok: true });
  sets.push(`updated_at = datetime('now','localtime')`);
  vals.push(req.params.id);
  db.prepare(`UPDATE candidatures SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM candidatures WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
