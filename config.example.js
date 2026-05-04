// dashboard/config.example.js
// ─────────────────────────────────────────────
// Copy this file to config.js and fill in your values.
// config.js is gitignored — never commit it.
// ─────────────────────────────────────────────

module.exports = {
  port: process.env.PORT || 3001,

  // ── WordPress REST API ──────────────────────
  // Create an Application Password in WP Admin > Users > Profile > Application Passwords
  wpBase: 'https://yoursite.com/wp-json/wp/v2',
  wpUser: 'your_wp_username',
  wpPassword: 'xxxx xxxx xxxx xxxx xxxx xxxx',

  // ── Docs widget ────────────────────────────
  // List of Markdown files to expose in the "Docs & Préférences" widget.
  // Paths are relative to the dashboard/ parent directory.
  // ⚠️  Never list files that contain secrets (passwords, API keys, etc.)
  docsFiles: [
    // { rel: 'NOTES.md',       tags: ['notes', 'workflow'] },
    // { rel: 'design.md',      tags: ['design', 'colors'] },
  ],

  // Directories scanned dynamically for .md files
  docsDynamicDirs: [
    // { dir: 'my-docs', tags: ['docs'] },
  ],

  // Directories scanned for PDF files
  docsPdfDirs: [
    // { dir: 'my-pdfs', tags: ['pdf'] },
  ],

  // ── Explorer widget ─────────────────────────
  // Map of directory names (relative to parent) → display config.
  // Only directories listed here will appear in the explorer widget.
  explorerDirs: {
    // 'my-folder': { type: 'code', icon: '📁', label: 'My Folder', viewer: 'dir' },
  },

  // ── Widgets ─────────────────────────────────
  // Active widgets in display order.
  widgets: [
    { id: 'explorer',      icon: '🗂',  title: 'Explorer',         span: 1 },
    { id: 'todo',          icon: '✅',  title: 'Todo',             span: 1,
      api: '/api/todos',
      item: { primary: 'text', badge: 'priority',
        badge_colors: { haute: 'red', normal: 'blue', basse: 'subtle' },
        actions: ['toggle', 'delete'] } },
    { id: 'candidatures',  icon: '💼',  title: 'Candidatures',     span: 1,
      api: '/api/candidatures',
      item: { primary: 'name', badge: 'status', secondary: 'date' } },
    { id: 'actions',       icon: '⚡',  title: 'Recent Sessions',  span: 1,
      api: '/api/sessions',
      item: { primary: 'title', secondary: 'date' } },
    { id: 'articles',      icon: '✍️', title: 'Articles & Wiki',  span: 2,
      api: '/api/wordpress',
      item: { primary: 'title', badge: 'status', secondary: 'date' } },
    { id: 'docs',          icon: '🗂️', title: 'Docs',             span: 1,
      api: '/api/docs',
      item: { primary: 'title', badge: 'type' } },
    { id: 'skills',        icon: '🧩',  title: 'Claude Skills',    span: 3,
      api: '/api/skills',
      item: { primary: 'name', secondary: 'description', badge: 'category' } },
    { id: 'scripts_list',  icon: '📜',  title: 'Scripts',          span: 2,
      api: '/api/scripts',
      item: { primary: 'title', secondary: 'description' } },
  ],
};
