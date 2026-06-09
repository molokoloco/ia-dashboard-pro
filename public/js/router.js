// js/router.js — minimal hash router for view switching
const VIEWS = ['home', 'roadmap'];

export function initRouter(onChange) {
  function apply() {
    const hash = (location.hash || '#home').replace('#', '');
    const view = VIEWS.includes(hash) ? hash : 'home';
    document.querySelectorAll('.view').forEach(s => {
      s.hidden = s.id !== `view-${view}`;
    });
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.view === view);
    });
    if (typeof onChange === 'function') onChange(view);
  }
  window.addEventListener('hashchange', apply);
  apply();
}
