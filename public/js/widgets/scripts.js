// js/widgets/scripts.js
import { $, esc, showToast } from '../utils.js';
import { api } from '../api.js';

export async function loadScripts() {
  const data = await api('/api/scripts');
  const body = $('body-scripts');
  if (!body) return;
  
  if ($('badge-scripts')) $('badge-scripts').textContent = `${data.length} scripts`;
  if (!data.length) { body.innerHTML = '<div class="empty">Aucun script trouvé</div>'; return; }

  body.innerHTML = data.map(s => `
    <div class="item">
      <div class="item-main">
        <div class="item-title">${esc(s.title)} <span style="font-size:11px;color:var(--muted);font-family:monospace;margin-left:6px;">${esc(s.name)}</span></div>
        <div class="item-meta" style="margin-top:2px;font-style:italic;">${esc(s.description)}</div>
      </div>
      <button class="sk-btn btn-copy-script" data-name="${esc(s.name)}" title="Copier la commande" style="margin-right:8px;">⚡ Copier</button>
      <span class="type-pill">js</span>
    </div>
  `).join('');

  body.querySelectorAll('.btn-copy-script').forEach(btn => {
    btn.onclick = () => {
        const cmd = `node scripts/${btn.dataset.name}`;
        navigator.clipboard.writeText(cmd).then(() => showToast(`⚡ Copié : ${cmd}`));
    };
  });
}
