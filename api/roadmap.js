const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const JSON_PATH = path.join(__dirname, '..', 'data', 'roadmap.json');
const { buildAndWrite } = require('../../../scripts/build_global_roadmap');

// Régen à l'ouverture, throttlée. Indépendant du cwd des wrap-up.
const TTL_MS = 60_000;
let cache = { data: null, ts: 0 };

router.get('/', (req, res) => {
  const fresh = req.query.fresh === '1';
  const now = Date.now();

  if (!fresh && cache.data && now - cache.ts < TTL_MS) {
    return res.json(cache.data);
  }

  try {
    const data = buildAndWrite(); // scan tous les ROADMAP.md/TODO.md + write-through roadmap.json
    cache = { data, ts: now };
    return res.json(data);
  } catch (e) {
    // Fallback : servir le dernier snapshot disque pour ne jamais casser la vue
    if (fs.existsSync(JSON_PATH)) {
      try {
        return res.json(JSON.parse(fs.readFileSync(JSON_PATH, 'utf8')));
      } catch (e2) {
        return res.status(500).json({ error: 'parse_failed', message: e2.message });
      }
    }
    return res.status(500).json({ error: 'build_failed', message: e.message });
  }
});

module.exports = router;
