// js/widgets/sessions.js
import { $, esc, fmtDate } from '../utils.js';
import { api } from '../api.js';

export async function loadSessions() {
  const data = await api('/api/sessions');
  const body = $('body-actions');
  if (!body) return;
  
  if ($('badge-actions')) $('badge-actions').textContent = `${data.length} session${data.length > 1 ? 's' : ''}`;

  if (!data.length) {
    body.innerHTML = '<div class="empty">Aucune session enregistrée</div>';
    return;
  }

  body.innerHTML = data.map(s => `
    <div class="session-item">
      <div class="session-header">
        <div class="session-title">🗓 ${esc(s.title)}</div>
        <div class="session-date">${fmtDate(s.date)}</div>
      </div>
      ${s.summary ? `<div class="session-summary">${esc(s.summary)}</div>` : ''}
      ${s.actions?.length ? `
        <ul class="session-actions">
          ${s.actions.map(a => `<li>${esc(a)}</li>`).join('')}
        </ul>` : ''}
      ${s.files?.length ? `
        <div class="session-files">
          ${s.files.map(f => `<span class="type-pill">${esc(f)}</span>`).join('')}
        </div>` : ''}
    </div>
  `).join('');
}

export function showActionForm() {
  $('modal-action').style.display = 'flex';
  setTimeout(() => $('session-title-input')?.focus(), 50);
}

export function hideActionForm() {
  $('modal-action').style.display = 'none';
  ['session-title-input','session-summary-input','session-actions-input','session-files-input']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
}

export async function submitAction() {
  const title = $('session-title-input').value.trim();
  if (!title) return;
  const actionsRaw = $('session-actions-input').value.trim();
  await api('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      summary:  $('session-summary-input').value.trim(),
      actions:  actionsRaw ? actionsRaw.split('\n').map(s => s.trim()).filter(Boolean) : [],
      files:    $('session-files-input').value.trim().split(',').map(s => s.trim()).filter(Boolean),
    }),
  });
  hideActionForm();
  await loadSessions();
}

window.showActionForm = showActionForm;
window.hideActionForm = hideActionForm;
window.submitAction = submitAction;
