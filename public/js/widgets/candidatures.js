// js/widgets/candidatures.js
import { $, esc, fmtDate, fmtSize } from '../utils.js';
import { api } from '../api.js';
import { unifiedPreview } from '../preview.js';
import { openMdModal } from '../ui.js';

const CAND_STATUS = ['brouillon', 'envoyée', 'en attente', 'entretien', 'refusée', 'acceptée'];

export async function loadCandidatures() {
  const [cands, cvs] = await Promise.all([
    api('/api/candidatures').catch(() => []),
    api('/api/cv').catch(() => []),
  ]);
  const body = $('body-cand');
  if (!body) return;

  const items = [
    ...cands.map(c => ({ _type: 'cand', _date: new Date(c.date), ...c })),
    ...cvs.map(f => ({
      _type: 'cv', _date: new Date(f.modified),
      filename: f.filename, url: f.url, ext: f.ext, size: f.size,
    })),
  ].sort((a, b) => b._date - a._date);

  if ($('badge-cand')) $('badge-cand').textContent = `${cvs.length} CVs · ${cands.length} candidatures`;

  if (!items.length) { body.innerHTML = '<div class="empty">Aucun fichier</div>'; return; }

  const link = (url, label, company) => url
    ? `<a href="#" class="cand-link" data-url="${esc(url)}" data-name="${esc(label)} — ${esc(company || '')}">${label}</a>`
    : '';

  body.innerHTML = items.map(item => {
    if (item._type === 'cv') {
      const p = (window.explorerRoot || '') + '/cv/' + item.filename;
      return `
      <div class="item clickable" data-path="${esc(p)}" data-name="${esc(item.filename)}" data-url="${item.url}">
        <div class="item-main">
          <div class="item-title">${esc(item.filename)}</div>
          <div class="item-meta">${fmtDate(item._date)} · ${fmtSize(item.size)}</div>
        </div>
        <span class="type-pill">${item.ext}</span>
      </div>`;
    }

    const metaBits = [fmtDate(item._date), item.lieu, item.contrat, item.salaire].filter(Boolean);
    const links = [
      link(item.cvUrl, 'CV', item.company),
      link(item.lettreUrl, 'lettre', item.company),
      link(item.offreUrl, 'offre', item.company),
    ].filter(Boolean).join(' · ');

    return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">
            ${esc(item.company || item.slug)}
            ${item.role ? `<span style="color:var(--muted)"> · ${esc(item.role)}</span>` : ''}
          </div>
          <div class="item-meta">${esc(metaBits.join(' · '))}${links ? ` &nbsp; ${links}` : ''}</div>
        </div>
        <select class="status status-${(item.status || 'brouillon').replace(/\s/g, '-')}" data-id="${item.id}">
          ${CAND_STATUS.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>`;
  }).join('');

  // CV racine : preview standard (iframe pour pdf/html)
  body.querySelectorAll('.item.clickable').forEach(el => {
    el.onclick = () => unifiedPreview(el.dataset.path, el.dataset.name, el.dataset.url);
  });
  // Liens candidature (CV / lettre / offre) servis en statique
  body.querySelectorAll('.cand-link').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const url = el.dataset.url, name = el.dataset.name;
      const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
      if (ext === 'md') previewMarkdownUrl(url, name);   // offre.md hors ROOT explorer
      else unifiedPreview('', name, url);                // pdf/html → iframe
    };
  });
  body.querySelectorAll('select.status').forEach(el => {
    el.onchange = e => updateCandStatus(parseInt(el.dataset.id), e.target.value);
  });
}

// Rend un .md servi statiquement dans la modale (offre.md vit hors du ROOT de /api/explorer)
async function previewMarkdownUrl(url, name) {
  try {
    const res = await fetch(url);
    const md = await res.text();
    openMdModal({ title: name, html: marked.parse(md), raw: md, url });
  } catch (e) {
    openMdModal({ title: name, html: `<p style="color:var(--red)">Erreur lecture: ${esc(e.message)}</p>` });
  }
}

export async function updateCandStatus(id, status) {
  await api(`/api/candidatures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  await loadCandidatures();
}
