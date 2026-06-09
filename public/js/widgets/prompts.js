// js/widgets/prompts.js
import { $, esc, showToast } from '../utils.js';
import { api } from '../api.js';
import { openMdModal } from '../ui.js';

let allPrompts = [];
let searchTimer = null;

const CAT_ICON = {
  'website-building': '🌐',
  'seo-local': '🔍',
  'cv-emploi': '💼',
  'productivite-cowork': '⚡',
  'presentations': '🎤',
  'design-creative': '🎨',
  'code-projects': '⚙️',
  'methodologie': '🧠',
  'youtube-notebooklm': '📺',
  'wordpress': '🟦',
};

export async function loadPrompts() {
  allPrompts = await api('/api/prompts');
  renderList(allPrompts);
  if ($('badge-prompts')) $('badge-prompts').textContent = `${allPrompts.length} prompts`;
}

function renderList(prompts) {
  const body = $('body-prompts');
  if (!body) return;
  if (!prompts.length) { body.innerHTML = '<div class="empty" style="padding:20px">Aucun prompt</div>'; return; }

  const byCategory = {};
  prompts.forEach(p => { (byCategory[p.category] = byCategory[p.category] || []).push(p); });

  const ul = document.createElement('ul');
  ul.className = 'xtree root';

  for (const [cat, items] of Object.entries(byCategory)) {
    const icon = CAT_ICON[cat] || '📦';
    const li = document.createElement('li');

    const summary = document.createElement('span');
    summary.className = 'xrow xdir';
    summary.innerHTML = `<span class="xtog open">▶</span><span class="xic">${icon}</span><span class="xnm">${esc(cat)}</span><span style="font-size:10px;color:var(--subtle);margin-left:4px">(${items.length})</span>`;

    const sub = document.createElement('ul');
    sub.className = 'xtree';

    summary.addEventListener('click', () => {
      const open = sub.style.display === 'none' ? '' : 'none';
      sub.style.display = open;
      summary.querySelector('.xtog').classList.toggle('open', open === '');
    });

    for (const p of items) {
      sub.appendChild(promptRow(p));
    }

    li.appendChild(summary);
    li.appendChild(sub);
    ul.appendChild(li);
  }

  body.innerHTML = '';
  body.appendChild(ul);
}

function renderSearchResults(results, q) {
  const body = $('body-prompts');
  if (!body) return;
  if (!results.length) {
    body.innerHTML = `<div class="empty" style="padding:20px">Aucun résultat pour "${esc(q)}"</div>`;
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'xtree root';
  for (const p of results) {
    const li = promptRow(p, true);
    if (p.snippet) {
      const snip = document.createElement('div');
      snip.style.cssText = 'padding:2px 12px 6px 36px;font-size:11px;color:var(--subtle);font-style:italic;';
      snip.textContent = p.snippet;
      li.appendChild(snip);
    }
    ul.appendChild(li);
  }
  body.innerHTML = '';
  body.appendChild(ul);
}

function promptRow(p, flat = false) {
  const sli = document.createElement('li');
  const row = document.createElement('span');
  row.className = 'xrow xskill';
  row.title = p.tags?.length ? `#${p.tags.join(' #')}` : '';

  const idEl = document.createElement('span');
  idEl.style.cssText = 'font-size:10px;color:var(--subtle);min-width:48px;font-family:monospace;';
  idEl.textContent = p.id;

  const nameEl = document.createElement('span');
  nameEl.className = 'xnm';
  nameEl.style.flex = '1';
  nameEl.textContent = p.title;
  if (flat) nameEl.textContent = `[${p.category}] ${p.title}`;

  const btnPreview = document.createElement('button');
  btnPreview.className = 'sk-btn';
  btnPreview.title = 'Lire le prompt';
  btnPreview.textContent = '📖';
  btnPreview.onclick = e => { e.stopPropagation(); openPromptPreview(p.id); };

  const btnCopy = document.createElement('button');
  btnCopy.className = 'sk-btn';
  btnCopy.title = 'Copier le prompt';
  btnCopy.textContent = '📋';
  btnCopy.onclick = async e => {
    e.stopPropagation();
    try {
      const data = await api(`/api/prompts/${p.id}`);
      await navigator.clipboard.writeText(data.raw || '');
      showToast(`📋 Copié : ${p.id}`);
    } catch (err) { showToast(`❌ ${err.message}`); }
  };

  row.appendChild(idEl);
  row.appendChild(nameEl);
  row.appendChild(btnPreview);
  row.appendChild(btnCopy);
  sli.appendChild(row);
  return sli;
}

export async function openPromptPreview(id) {
  const data = await api(`/api/prompts/${id}`);
  openMdModal({
    title: `${data.id} — ${data.title}`,
    description: `${data.category} · ${data.file}`,
    tags: data.tags || [],
    html: data.html,
  });
}

const searchInput = $('prompts-search');
if (searchInput) {
  searchInput.addEventListener('input', e => {
    const q = e.target.value.trim();
    clearTimeout(searchTimer);
    if (!q) { renderList(allPrompts); return; }
    searchTimer = setTimeout(async () => {
      try {
        const results = await api(`/api/prompts/search?q=${encodeURIComponent(q)}`);
        renderSearchResults(results, q);
      } catch (err) { console.error(err); }
    }, 300);
  });
}

window.openPromptPreview = openPromptPreview;
