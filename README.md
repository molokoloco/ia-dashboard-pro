# 🚀 IA Dashboard Pro

[![Node](https://img.shields.io/badge/node-%3E=18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/sqlite-better--sqlite3-003B57?logo=sqlite&logoColor=white)](https://github.com/WiseLibs/better-sqlite3)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Made by](https://img.shields.io/badge/made%20by-JulienWeb.fr-5A4095)](https://julienweb.fr)

> **Personal local dashboard** for managing a WordPress site, todos, job applications, Claude AI sessions, and local files — all in one dark-themed web UI running on `localhost:3001`.

Built to run **locally on your own machine** as a developer command center. Not designed for public exposure.

---

## ✨ Features

| Widget | Description |
|--------|-------------|
| 🗂 **Explorer** | Browse local project directories with type-aware viewers (gallery, wiki, code, pdf…) |
| ✅ **Todo** | Kanban-style todo list with priorities (SQLite) |
| 💼 **Candidatures** | Job application tracker with status pipeline (SQLite) |
| ⚡ **Sessions** | Log Claude AI work sessions with actions + files |
| ✍️ **Articles & Wiki** | Live WordPress articles + local Markdown wiki |
| 🗂️ **Docs** | Quick access to personal Markdown docs and PDFs |
| 🧩 **Claude Skills** | Browse your local Claude Code skills catalog |
| 📜 **Scripts** | List available Node.js automation scripts |

---

## ⚡ TL;DR

```bash
git clone https://github.com/molokoloco/ia-dashboard-pro.git
cd ia-dashboard-pro
npm install
cp config.example.js config.js   # then edit with your values
node server.js
# → http://localhost:3001
```

---

## 🛠️ Installation

### 1. Clone & install

```bash
git clone https://github.com/molokoloco/ia-dashboard-pro.git
cd ia-dashboard-pro
npm install
```

### 2. Configure

```bash
cp config.example.js config.js
```

Edit `config.js` with your values:

```js
module.exports = {
  port: 3001,

  // WordPress REST API — create an Application Password in WP Admin
  wpBase: 'https://yoursite.com/wp-json/wp/v2',
  wpUser: 'your_wp_username',
  wpPassword: 'xxxx xxxx xxxx xxxx xxxx xxxx',

  // Files to show in the Docs widget (paths relative to parent directory)
  docsFiles: [
    { rel: 'NOTES.md', tags: ['notes'] },
  ],

  // Explorer widget — which directories to expose
  explorerDirs: {
    'my-folder': { type: 'code', icon: '📁', label: 'My Folder', viewer: 'dir' },
  },

  // Widgets to display
  widgets: [ /* see config.example.js for full list */ ],
};
```

> ⚠️ **`config.js` is gitignored.** It contains your credentials and personal paths — never commit it.

### 3. Run

```bash
node server.js
# or
npm start
```

Open **http://localhost:3001**

---

## 🗂️ Project Structure

```
dashboard/
├── server.js              Express entry point (port 3001)
├── db.js                  SQLite helpers (better-sqlite3)
├── config.js              Local config — gitignored (copy from config.example.js)
├── config.example.js      Config template — safe to commit
├── api/
│   ├── wordpress.js       GET /api/wordpress/posts|pages|categories  → WP REST API proxy
│   ├── wiki.js            GET /api/wiki                              → local Markdown files
│   ├── todos.js           CRUD /api/todos                            → SQLite
│   ├── candidatures.js    CRUD /api/candidatures                     → SQLite
│   ├── sessions.js        CRUD /api/sessions                         → JSON log
│   ├── actions.js         CRUD /api/actions                          → SQLite
│   ├── docs.js            GET /api/docs                              → Markdown + PDF index
│   ├── skills.js          GET /api/skills                            → Claude Skills catalog
│   ├── scripts.js         GET /api/scripts                           → local JS scripts list
│   ├── cv.js              GET /api/cv                                → PDF/HTML CV list
│   └── explorer.js        GET /api/explorer                          → local filesystem browser
└── public/
    ├── index.html         Single-page frontend
    ├── app.js             Vanilla JS (auto-refresh every 60s)
    └── style.css          Dark theme
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | List todos |
| POST | `/api/todos` | Create todo `{ text, priority }` |
| PATCH | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |
| GET | `/api/candidatures` | List job applications |
| POST | `/api/candidatures` | Create application |
| PATCH | `/api/candidatures/:id` | Update status / notes |
| GET | `/api/sessions` | List Claude sessions |
| POST | `/api/sessions` | Log session `{ title, summary, actions[], files[] }` |
| GET | `/api/wordpress/posts` | WordPress posts (live) |
| GET | `/api/wordpress/pages` | WordPress pages (live) |
| GET | `/api/wiki` | Local Markdown wiki articles |
| GET | `/api/docs` | Markdown docs + PDF index |
| GET | `/api/skills` | Claude Skills catalog |
| GET | `/api/explorer` | Directory listing |

---

## 🗄️ Database Schema

```sql
todos        (id, text, done, priority, created_at)
candidatures (id, filename, company, role, status, note, updated_at)
actions      (id, type, description, context, created_at)
```

The SQLite database (`dashboard.db`) is created automatically on first run and is gitignored.

---

## 📁 Static paths

`server.js` serves several directories from the parent folder as static assets. These are designed for a specific project structure and will simply 404 gracefully if absent. Edit or remove them in `server.js` to match your setup:

```js
app.use('/static/cv',      express.static(path.join(__dirname, '../cv')));
app.use('/static/offres',  express.static(path.join(__dirname, '../Offres')));
```

---

## 🔒 Security notes

- **Local use only.** This dashboard is designed to run on `localhost`. Do not expose it on a public network.
- **`api/explorer.js`** allows browsing and reading files from the parent directory tree. By design, for local developer use.
- `config.js` is gitignored. Your credentials stay on your machine.

---

## 🧰 Stack

- **Runtime:** Node.js ≥ 18
- **Server:** Express 5
- **Database:** better-sqlite3 (SQLite)
- **Markdown:** marked
- **Frontend:** Vanilla JS + CSS (no build step)

---

## 👤 Author

**Julien Guézennec** — Freelance web developer & consultant IA, Pantin (93), France  
🌐 [julienweb.fr](https://julienweb.fr) · 🐙 [github.com/molokoloco](https://github.com/molokoloco)
