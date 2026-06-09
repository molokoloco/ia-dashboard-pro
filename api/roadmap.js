const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const JSON_PATH = path.join(__dirname, '..', 'data', 'roadmap.json');

router.get('/', (req, res) => {
  if (!fs.existsSync(JSON_PATH)) {
    return res.json({ generatedAt: null, projects: [], stale: true });
  }
  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf8');
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: 'parse_failed', message: e.message });
  }
});

module.exports = router;
