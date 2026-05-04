const express = require('express');
const router = express.Router();
const https = require('https');
const cfg = require('../config');

const WP_BASE = cfg.wpBase || 'https://yoursite.com/wp-json/wp/v2';
const WP_AUTH = (cfg.wpUser && cfg.wpPassword)
  ? Buffer.from(`${cfg.wpUser}:${cfg.wpPassword}`).toString('base64')
  : null;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function wpFetch(endpoint) {
  if (!WP_AUTH) return Promise.reject(new Error('WordPress not configured (see config.js)'));
  return new Promise((resolve, reject) => {
    const url = new URL(WP_BASE + endpoint);
    const req = https.get({
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        Authorization: `Basic ${WP_AUTH}`,
        'User-Agent': UA,
      },
    }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Parse error: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

router.get('/posts', async (req, res) => {
  try {
    const per_page = Math.min(parseInt(req.query.per_page) || 10, 50);
    const data = await wpFetch(`/posts?per_page=${per_page}&_fields=id,title,date,slug,link,excerpt,status,categories&orderby=date&order=desc`);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/pages', async (req, res) => {
  try {
    const data = await wpFetch('/pages?per_page=30&_fields=id,title,date,slug,status&orderby=title&order=asc');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const data = await wpFetch('/categories?per_page=50&_fields=id,name,count');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
