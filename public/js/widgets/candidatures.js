// js/widgets/candidatures.js
import { $, esc, fmtDate, fmtSize } from '../utils.js';
import { api } from '../api.js';
import { unifiedPreview } from '../preview.js';

const CAND_STATUS = ['envoyée', 'en attente', 'entretien', 'refusée', 'acceptée'];

export async function loadCandidatures() {
  const [cands, cvs] = await Promise.all([
    api('/api/candidatures').catch(() => []),
    api('/api/cv').catch(() => []),
  ]);
  const body = $('body-cand');
  if (!body) return;

  const items = [
    ...cands.map(c => ({
      _type: 'cand', _date: new Date(c.updated_at),
      ...c,
    })),
    ...cvs.map(f => ({
      _type: 'cv', _date: new Date(f.modified),
      filename: f.filename, url: f.url, ext: f.ext, size: f.size,
    })),
  ].sort((a, b) => b._date - a._date);

  if ($('badge-cand')) $('badge-cand').textContent = `${cvs.length} CVs · ${cands.length} offres`;

  if (!items.length) { body.innerHTML = '<div class="empty">Aucun fichier</div>'; return; }

  body.innerHTML = items.map(item => {
    if (item._type === 'cv') {
      const path = (window.explorerRoot || '') + '/cv/' + item.filename;
      return `
      <div class="item clickable" data-path="${esc(path)}" data-name="${esc(item.filename)}" data-url="${item.url}">
        <div class="item-main">
          <div class="item-title">${esc(item.filename)}</div>
          <div class="item-meta">${fmtDate(item._date)} · ${fmtSize(item.size)}</div>
        </div>
        <span class="type-pill">${item.ext}</span>
      </div>`;
    }

    const offerUrl = `/static/offres/${encodeURIComponent(item.filename)}`;
    const offerPath = (window.explorerRoot || '') + '/Offres/' + item.filename;
    return `
      <div class="item">
        <div class="item-main clickable" data-path="${esc(offerPath)}" data-name="${esc(item.company || item.filename)}" data-url="${offerUrl}">
          <div class="item-title">
            ${esc(item.company || item.filename)}
            ${item.role ? `<span style="color:var(--muted)"> · ${esc(item.role)}</span>` : ''}
          </div>
          <div class="item-meta">${fmtDate(item._date)}</div>
        </div>
        <select class="status status-${(item.status || 'envoyée').replace(/\s/g, '-')}" data-id="${item.id}">
          ${CAND_STATUS.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>`;
  }).join('');

  body.querySelectorAll('.clickable').forEach(el => {
    el.onclick = () => unifiedPreview(el.dataset.path, el.dataset.name, el.dataset.url);
  });
  body.querySelectorAll('select.status').forEach(el => {
    el.onchange = e => updateCandStatus(parseInt(el.dataset.id), e.target.value);
  });
}

export async function updateCandStatus(id, status) {
  // We need the other data too, so we'd normally fetch or keep it in state
  // For now, assume API handles partial updates if we change it, or just use what we have
  await api(`/api/candidatures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  await loadCandidatures();
}
