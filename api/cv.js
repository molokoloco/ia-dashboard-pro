const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CV_DIR = path.join(__dirname, '../../cv');

router.get('/', (req, res) => {
  const files = fs.readdirSync(CV_DIR)
    .filter(f => /\.(pdf|html)$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(CV_DIR, f));
      return {
        filename: f,
        ext: path.extname(f).toLowerCase().slice(1),
        size: stat.size,
        modified: stat.mtime,
        url: `/static/cv/${encodeURIComponent(f)}`,
      };
    })
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  res.json(files);
});

module.exports = router;
