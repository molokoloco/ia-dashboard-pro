const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Static file serving for PDFs
app.use('/static/cv', express.static(path.join(__dirname, '../cv')));
app.use('/static/offres', express.static(path.join(__dirname, '../Offres')));
app.use('/static/julien-ia', express.static(path.join(__dirname, '../Julien-ia')));

// Frontend
app.use(express.static(path.join(__dirname, 'public')));

// Other
app.use('/scrap', express.static(path.join(__dirname, '../scrap')));

// API routes
app.use('/api/wiki', require('./api/wiki'));
app.use('/api/wordpress', require('./api/wordpress'));
app.use('/api/cv', require('./api/cv'));
app.use('/api/candidatures', require('./api/candidatures'));
app.use('/api/todos', require('./api/todos'));
app.use('/api/actions', require('./api/actions'));
app.use('/api/skills', require('./api/skills'));
app.use('/api/docs', require('./api/docs'));
app.use('/api/sessions', require('./api/sessions'));
app.use('/api/explorer', require('./api/explorer'));
app.use('/api/scripts', require('./api/scripts'));

const PORT = process.env.PORT || 3001;
const workspaceRoot = path.resolve(__dirname, '..');
console.log('  Workspace: ' + workspaceRoot);

// Middleware to block sensitive files in /workspace
const blocked = [
  '.git', '.claude', 'node_modules', 'config.js', 'package-lock.json', 
  '.env', 'dashboard.db', 'sessions-log.json', '.obsidian'
];

app.use('/workspace', (req, res, next) => {
  const isBlocked = blocked.some(p => req.path.includes(`/${p}/`) || req.path.endsWith(`/${p}`) || req.path === `/${p}`);
  if (isBlocked || req.path.split('/').some(part => part.startsWith('.'))) {
    return res.status(403).send('Access Forbidden');
  }
  next();
}, express.static(workspaceRoot));

app.listen(PORT, () => {
  console.log(`\n  Dashboard: http://localhost:${PORT}\n`);
});
