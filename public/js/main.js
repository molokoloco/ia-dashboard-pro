// js/main.js
import { $ } from './utils.js';
import { api } from './api.js';
import { toggleEditMode, saveCurrentFile, closeMdModal } from './ui.js';
import { loadExplorer, openExplorerRoot } from './widgets/explorer.js';
import { loadTodos, addTodo } from './widgets/todo.js';
import { loadCandidatures } from './widgets/candidatures.js';
import { loadWiki } from './widgets/wiki.js';
import { loadSessions } from './widgets/sessions.js';
import { loadDocs } from './widgets/docs.js';
import { loadSkills } from './widgets/skills.js';
import { loadScripts } from './widgets/scripts.js';

// ── Clock ────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const clockEl = $('clock');
  if (clockEl) {
    clockEl.textContent =
        now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        + ' · ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}

// ── App State & Initialization ───────────────────────────
let config = {};

async function loadConfig() {
  try {
    config = await api('/api/explorer/config'); // This returns explorerDirs
    // We could also fetch widgets.json directly if we had a route for it
  } catch(e) { console.warn("Could not load config:", e); }
}

async function loadAll() {
  console.log('Refreshing data...');
  await Promise.allSettled([
    loadTodos(),
    loadCandidatures(),
    loadWiki(),
    loadSessions(),
    loadDocs(),
    loadScripts(),
    loadSkills()
  ]);
}

async function init() {
  updateClock();
  setInterval(updateClock, 30000);

  try {
    await loadConfig();
    await loadExplorer(); 
    await loadAll();
  } catch(e) {
    console.error("Initialization error:", e);
  }

  setInterval(loadAll, 60000);
}

// ── Global Handlers (for HTML onclick) ───────────────────
window.toggleEditMode = toggleEditMode;
window.saveCurrentFile = saveCurrentFile;
window.closeMdModal = closeMdModal;
window.addTodo = addTodo;
window.openExplorerRoot = openExplorerRoot;

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
