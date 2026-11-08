const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Source de vérité : fiches CRM du projet Julien-Pro (lecture seule ; Julienweb.fr jusqu'au 08/11/2026).
// Le statut vit dans le frontmatter de chaque fiche → pas d'overlay SQLite (≠ candidatures).
// Chemin lu par ~/.claude/scripts/_chemins.js (bloc `chemins` de ecosysteme.json) ; repli : variable CRM_DIR.
const CRM_DIR = (() => {
  try { return require(path.join(require('os').homedir(), '.claude/scripts/_chemins.js')).chemin('crm'); }
  catch { return process.env.CRM_DIR || 'D:/Google Drive/MON ENTREPRISE/julien-pro/clients'; }
})();
router.CRM_DIR = CRM_DIR;
const FICHES_DIR = path.join(CRM_DIR, 'fiches');
const INDEX_MD = path.join(CRM_DIR, 'INDEX.md');

// Ordre du pipeline (par emoji de tête du statut) — sert au tri + regroupement.
const PIPELINE = ['🆕', '❓', '📧', '✅', '🔧', '🧾', '💰', '🔁', '🏁', '🕳️', '🚫'];

// Frontmatter YAML minimal : scalaires `key: value` + listes `key:` suivies de `  - item`.
function parseFrontmatter(md) {
  const m = md.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  const lines = m[1].split(/\r?\n/);
  let listKey = null;
  for (const line of lines) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (listKey && item) {
      out[listKey].push(item[1].trim().replace(/\s+#.*$/, '').replace(/^["']|["']$/g, ''));
      continue;
    }
    listKey = null;
    const kv = line.match(/^([A-Za-z_]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1].trim();
    const val = kv[2].trim();
    if (val === '') { out[key] = []; listKey = key; } // début de liste (ou vide)
    else if (/^\[\s*\]$/.test(val)) out[key] = []; // liste vide inline `[]`
    else out[key] = val.replace(/\s+#.*$/, '').replace(/^["']|["']$/g, '');
  }
  return out;
}

function pipeRank(statut) {
  const emoji = (statut || '').trim().split(/\s/)[0];
  const i = PIPELINE.indexOf(emoji);
  return { emoji, rank: i < 0 ? 99 : i };
}

// Récupère la colonne « Prochaine action » de l'INDEX pour un slug (cellule avant la cellule Fiche).
function nextActions() {
  const map = {};
  if (!fs.existsSync(INDEX_MD)) return map;
  const md = fs.readFileSync(INDEX_MD, 'utf8');
  for (const line of md.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').map(c => c.trim());
    // retire les bords vides
    while (cells.length && cells[0] === '') cells.shift();
    while (cells.length && cells[cells.length - 1] === '') cells.pop();
    if (cells.length < 3) continue;
    const ficheCell = cells[cells.length - 1];
    const action = cells[cells.length - 2];
    const links = ficheCell.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const l of links) {
      const slug = l.replace(/\[\[|\]\]/g, '').split(/[·|]/)[0].trim();
      if (slug && !map[slug]) map[slug] = action;
    }
  }
  return map;
}

function scanClients() {
  if (!fs.existsSync(FICHES_DIR)) return [];
  const actions = nextActions();
  const out = [];
  for (const file of fs.readdirSync(FICHES_DIR)) {
    if (!file.endsWith('.md') || file.startsWith('_')) continue;
    const slug = file.replace(/\.md$/, '');
    const fm = parseFrontmatter(fs.readFileSync(path.join(FICHES_DIR, file), 'utf8'));
    const statut = fm.statut || '🆕 Lead';
    const { emoji, rank } = pipeRank(statut);
    const emails = Array.isArray(fm.emails) ? fm.emails : (fm.emails ? [fm.emails] : []);
    out.push({
      slug,
      client: fm.client || slug,
      entreprise: fm.entreprise || '',
      type: fm.type || '',
      statut,
      emoji,
      rank,
      tel: fm.tel || '',
      emails,
      source: fm.source || '',
      nextAction: actions[slug] || '',
      ficheUrl: `/static/clients/fiches/${encodeURIComponent(file)}`,
    });
  }
  return out.sort((a, b) => a.rank - b.rank || a.client.localeCompare(b.client));
}

router.get('/', (req, res) => {
  res.json(scanClients());
});

module.exports = router;
