// js/widgets/clients.js — CRM prestation JulienWeb (lecture seule, onglet #roadmap)
// Source de vérité = fiches .md du CRM julien-pro/clients/ (Julienweb.fr/clients/ jusqu'au 08/11/2026). Statut dans le frontmatter.
import { $, esc } from '../utils.js';
import { api } from '../api.js';
import { openMdModal } from '../ui.js';

export async function loadClients() {
  const clients = await api('/api/clients').catch(() => []);
  const body = $('body-clients');
  if (!body) return;

  if ($('badge-clients')) {
    const actifs = clients.filter(c => !['🏁', '🕳️', '🚫'].includes(c.emoji)).length;
    $('badge-clients').textContent = `${actifs} actif${actifs > 1 ? 's' : ''} / ${clients.length}`;
  }

  if (!clients.length) { body.innerHTML = '<div class="empty">Aucun client</div>'; return; }

  // Regroupement par statut, dans l'ordre du pipeline (déjà trié côté API par rank).
  const groups = [];
  for (const c of clients) {
    let g = groups.find(x => x.statut === c.statut);
    if (!g) { g = { statut: c.statut, items: [] }; groups.push(g); }
    g.items.push(c);
  }

  body.innerHTML = groups.map(g => `
    <div class="client-group">
      <div class="client-group-head">${esc(g.statut)} <span style="color:var(--muted)">· ${g.items.length}</span></div>
      ${g.items.map(item => {
        const meta = [item.type, item.tel, (item.emails && item.emails[0])].filter(Boolean).join(' · ');
        return `
        <div class="item">
          <div class="item-main">
            <div class="item-title">
              <a href="#" class="client-link" data-url="${esc(item.ficheUrl)}" data-name="${esc(item.client)}">${esc(item.client)}</a>
              ${item.entreprise && item.entreprise !== item.client ? `<span style="color:var(--muted)"> · ${esc(item.entreprise)}</span>` : ''}
            </div>
            <div class="item-meta">${esc(meta)}</div>
            ${item.nextAction ? `<div class="item-meta" style="color:var(--accent, #6ea8fe)">→ ${esc(item.nextAction)}</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');

  body.querySelectorAll('.client-link').forEach(el => {
    el.onclick = async (e) => {
      e.preventDefault();
      try {
        const md = await (await fetch(el.dataset.url)).text();
        openMdModal({ title: el.dataset.name, html: marked.parse(md), raw: md, url: el.dataset.url });
      } catch (err) {
        openMdModal({ title: el.dataset.name, html: `<p style="color:var(--red)">Erreur: ${esc(err.message)}</p>` });
      }
    };
  });
}
