// js/widgets/candidatures.js — chaque candidature = une mini-roadmap (statut), onglet #roadmap
import { $, esc, fmtDate } from '../utils.js';
import { api } from '../api.js';
import { unifiedPreview } from '../preview.js';
import { openMdModal } from '../ui.js';

const CAND_STATUS = ['brouillon', 'envoyée', 'en attente', 'entretien', 'refusée', 'acceptée'];

export async function loadCandidatures() {
  const cands = await api('/api/candidatures').catch(() => []);
  const body = $('body-cand');
  if (!body) return;

  if ($('badge-cand')) $('badge-cand').textContent = `${cands.length} candidature${cands.length > 1 ? 's' : ''}`;

  if (!cands.length) { body.innerHTML = '<div class="empty">Aucune candidature</div>'; return; }

  const link = (url, label, company) => url
    ? `<a href="#" class="cand-link" data-url="${esc(url)}" data-name="${esc(label)} — ${esc(company || '')}">${label}</a>`
    : '';

  body.innerHTML = cands.map(item => {
    const metaBits = [fmtDate(new Date(item.date)), item.lieu, item.contrat, item.salaire].filter(Boolean);
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

  body.querySelectorAll('.cand-link').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const url = el.dataset.url, name = el.dataset.name;
      const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
      if (ext === 'md') previewMarkdownUrl(url, name);   // offre.md hors ROOT explorer → marked
      else unifiedPreview('', name, url);                // pdf/html → iframe
    };
  });
  body.querySelectorAll('select.status').forEach(el => {
    el.onchange = e => updateCandStatus(parseInt(el.dataset.id), e.target.value);
  });
}

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
