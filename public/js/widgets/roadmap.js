// js/widgets/roadmap.js — render N project widgets in #view-roadmap
import { $, esc, relDate } from '../utils.js';
import { api } from '../api.js';

const STATUS_MARKER = {
  blocked: '🔴',
  wip: '🟡',
  open: '☐',
  done: '🟢',
  closed: '✅',
};

let loaded = false;

export async function loadRoadmap({ force = false } = {}) {
  if (loaded && !force) return;
  loaded = true;
  const view = $('view-roadmap');
  if (!view) return;
  const metaBar = $('roadmap-meta');
  try {
    const data = await api('/api/roadmap');
    render(view, metaBar, data);
  } catch (e) {
    if (metaBar) metaBar.textContent = `Erreur: ${e.message}`;
  }
}

function render(view, metaBar, data) {
  view.querySelectorAll('.project-widget').forEach(n => n.remove());

  if (data.stale || !data.generatedAt) {
    if (metaBar) {
      metaBar.innerHTML = `<span style="color:var(--orange)">⚠ Aucun snapshot trouvé.</span> Exécute <code>node scripts/build_global_roadmap.js</code> dans le workspace.`;
    }
    return;
  }

  if (metaBar) {
    metaBar.innerHTML = `Snapshot regen <strong>${relDate(data.generatedAt)}</strong> · <span style="color:var(--muted)">${data.projects.length} projets scannés</span> · <a href="#" onclick="window.refreshRoadmap();return false;" style="color:var(--lightblue)">↻ recharger</a>`;
  }

  for (const p of data.projects) {
    view.appendChild(buildProjectCard(p));
  }
}

const STATUS_ICON = { active: '🗺️', pause: '⏸️', done: '✅', archived: '📦' };

function buildProjectCard(p) {
  const card = document.createElement('div');
  card.className = 'widget project-widget';
  card.dataset.status = p.status;

  const header = document.createElement('div');
  header.className = 'widget-header';
  const icon = STATUS_ICON[p.status] || '🗺️';
  header.innerHTML = `
    <div class="widget-title">
      <span class="icon">${icon}</span>
      <span>${esc(p.title || p.slug)}</span>
    </div>
    <span class="pw-status-badge s-${esc(p.status)}">${esc(p.status)}</span>
  `;
  card.appendChild(header);

  const body = document.createElement('div');
  body.className = 'widget-body';

  const meta = document.createElement('div');
  meta.className = 'pw-meta';
  meta.innerHTML = `
    <div class="pw-counts">
      ${countSpan('done', p.counts.done)}
      ${countSpan('wip', p.counts.wip)}
      ${countSpan('blocked', p.counts.blocked)}
      ${countSpan('closed', p.counts.closed)}
    </div>
    <div style="margin-left:auto;">updated ${relDate(p.lastUpdated)}</div>
  `;
  body.appendChild(meta);

  if (p.roadmap && p.roadmap.framework) {
    const fw = document.createElement('div');
    fw.className = 'pw-framework';
    fw.textContent = p.roadmap.framework;
    body.appendChild(fw);
  }

  if (p.roadmap) {
    body.appendChild(buildSection('Roadmap', p.roadmap.items, p.roadmap.path));
  }
  if (p.todos) {
    body.appendChild(buildSection('Todo', p.todos.items, p.todos.path));
  }
  if (p.cases) {
    body.appendChild(buildSection('Demandes en cours', p.cases.items, p.cases.path));
  }
  if (!p.roadmap && !p.todos && !p.cases) {
    const empty = document.createElement('div');
    empty.className = 'pw-empty';
    empty.textContent = 'Aucun ROADMAP.md ni TODO.md détecté.';
    body.appendChild(empty);
  }

  card.appendChild(body);
  return card;
}

function buildSection(label, items, sourcePath) {
  const wrap = document.createElement('div');
  wrap.className = 'pw-section';

  const head = document.createElement('div');
  head.className = 'pw-section-head';
  const labelEl = document.createElement('span');
  labelEl.textContent = `▸ ${label}`;
  head.appendChild(labelEl);
  if (sourcePath) {
    const src = document.createElement('span');
    src.style.cssText = 'color:var(--subtle);font-size:10px;font-weight:normal;text-transform:none;letter-spacing:0;';
    src.textContent = sourcePath;
    src.title = sourcePath;
    head.appendChild(src);
  }
  wrap.appendChild(head);

  if (!items || items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pw-empty';
    empty.textContent = 'Aucun item actif.';
    wrap.appendChild(empty);
    return wrap;
  }

  const ul = document.createElement('ul');
  ul.className = 'pw-items';
  for (const it of items) {
    const li = document.createElement('li');
    const marker = STATUS_MARKER[it.status] || '·';
    li.innerHTML = `<span class="pw-marker">${marker}</span><span>${esc(it.text)}</span>`;
    ul.appendChild(li);
  }
  wrap.appendChild(ul);
  return wrap;
}

function countSpan(key, n) {
  if (!n) return '';
  return `<span class="c-${key}">${STATUS_MARKER[key === 'done' ? 'done' : key === 'wip' ? 'wip' : key === 'blocked' ? 'blocked' : 'closed']} ${n}</span>`;
}

window.refreshRoadmap = () => loadRoadmap({ force: true });
