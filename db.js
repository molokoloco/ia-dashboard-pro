const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'dashboard.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS candidatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    company TEXT DEFAULT '',
    role TEXT DEFAULT '',
    status TEXT DEFAULT 'envoyée',
    note TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'general',
    description TEXT NOT NULL,
    context TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

module.exports = db;
