// js/main.js
import { $ } from './utils.js';
import { toggleEditMode, saveCurrentFile, closeMdModal } from './ui.js';
import { loadTodos, addTodo } from './widgets/todo.js';
import { loadCandidatures } from './widgets/candidatures.js';
import { loadClients } from './widgets/clients.js';
import { loadSessions } from './widgets/sessions.js';
import { loadPrompts } from './widgets/prompts.js';
import { loadSkills } from './widgets/skills.js';
import { loadRoadmap } from './widgets/roadmap.js';
import { initRouter } from './router.js';

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
async function loadAll() {
  console.log('Refreshing data...');
  await Promise.allSettled([
    loadTodos(),
    loadSessions(),
    loadPrompts(),
    loadSkills()
  ]);
}

async function init() {
  updateClock();
  setInterval(updateClock, 30000);

  initRouter(view => {
    if (view === 'roadmap') { loadRoadmap(); loadCandidatures(); loadClients(); }
  });

  try {
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

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
