// js/widgets/docs.js
import { $, esc, renderTags } from '../utils.js';
import { api } from '../api.js';
import { unifiedPreview } from '../preview.js';

export async function loadDocs() {
  const data = await api('/api/docs');
  const body = $('body-docs');
  if (!body) return;
  
  if ($('badge-docs')) $('badge-docs').textContent = `${data.length} fichiers`;
  if (!data.length) { body.innerHTML = '<div class="empty">Aucun fichier</div>'; return; }

  const sections = {};
  data.forEach(doc => {
    const s = doc.section || 'Références';
    (sections[s] = sections[s] || []).push(doc);
  });

  const SECTION_ICON = { 'Références': '📌', 'Julien-ia': '🤖', 'cv': '📄' };

  body.innerHTML = Object.entries(sections).map(([sec, docs]) => `
    <div class="section-label" style="margin-top:10px;">${SECTION_ICON[sec] || '📁'} ${sec}</div>
    ${docs.map(doc => {
      const isPdf = doc.type === 'pdf';
      let rel = doc.rel.startsWith('/') ? doc.rel.slice(1) : doc.rel;
      const fullPath = (window.explorerRoot || '') + '/' + rel;
      return `
      <div class="item clickable" data-path="${esc(fullPath.replace(/\\/g, '/'))}" data-title="${esc(doc.title)}" data-url="${doc.url}">
        <div class="item-main">
          <div class="item-title">${isPdf ? '📑 ' : ''}${esc(doc.title)}</div>
          ${doc.description ? `<div class="item-meta" style="margin-bottom:4px;">${esc(doc.description.slice(0, 90))}${doc.description.length > 90 ? '…' : ''}</div>` : ''}
          ${renderTags(doc.tags)}
        </div>
        <span class="type-pill">${doc.type}</span>
      </div>`;
    }).join('')}
  `).join('');

  body.querySelectorAll('.clickable').forEach(el => {
    el.onclick = () => unifiedPreview(el.dataset.path, el.dataset.title, el.dataset.url);
  });
}
