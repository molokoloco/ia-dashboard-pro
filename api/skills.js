const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SKILLS_DIR = path.join(__dirname, '../../skills/awesome-claude-skills');

// Skills à ignorer (dossiers utilitaires, pas des skills réels)
const IGNORE = new Set(['composio-skills', 'connect-apps-plugin', 'template-skill', 'connect-apps', 'connect', 'skill-share', 'document-skills']);

function readSkill(skillPath, name) {
  const skillMd = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMd)) return null;

  const raw = fs.readFileSync(skillMd, 'utf-8');
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  let meta = { name, description: '' };
  let body = raw;

  if (match) {
    body = match[2];
    match[1].split('\n').forEach(line => {
      const colon = line.indexOf(':');
      if (colon === -1) return;
      const key = line.slice(0, colon).trim();
      const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
      meta[key] = val;
    });
  }

  return { name, description: meta.description || '', body };
}

// Catégories manuelles
const CATEGORIES = {
  'Contenu & Rédaction': ['content-research-writer', 'changelog-generator', 'internal-comms', 'twitter-algorithm-optimizer'],
  'CV & Carrière':       ['tailored-resume-generator', 'developer-growth-analysis', 'lead-research-assistant'],
  'Documents & Fichiers':['artifacts-builder', 'file-organizer', 'invoice-organizer', 'image-enhancer'],
  'Design & Visuel':     ['brand-guidelines', 'canvas-design', 'theme-factory', 'slack-gif-creator'],
  'Dev & Tech':          ['webapp-testing', 'mcp-builder', 'langsmith-fetch', 'video-downloader'],
  'Business & Marketing':['competitive-ads-extractor', 'domain-name-brainstormer', 'meeting-insights-analyzer', 'raffle-winner-picker'],
  'Skills & Claude':     ['skill-creator'],
};

function getCategory(name) {
  for (const [cat, skills] of Object.entries(CATEGORIES)) {
    if (skills.includes(name)) return cat;
  }
  return 'Autre';
}

router.get('/', (req, res) => {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !IGNORE.has(d.name))
    .map(d => {
      const skill = readSkill(path.join(SKILLS_DIR, d.name), d.name);
      if (!skill) return null;
      return {
        name: skill.name,
        description: skill.description,
        category: getCategory(skill.name),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  res.json(entries);
});

router.get('/:name', (req, res) => {
  const skillPath = path.join(SKILLS_DIR, req.params.name);
  if (!fs.existsSync(skillPath)) return res.status(404).json({ error: 'Not found' });
  const skill = readSkill(skillPath, req.params.name);
  if (!skill) return res.status(404).json({ error: 'No SKILL.md' });
  res.json({ ...skill, html: marked(skill.body) });
});

module.exports = router;
