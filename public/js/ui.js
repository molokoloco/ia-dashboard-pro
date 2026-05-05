// js/ui.js
import { $, esc, showToast } from './utils.js';
import { api } from './api.js';

let currentFilePath = null;
let currentRawContent = '';

export function openMdModal({ title, description, tags, html, raw, path, type, url }) {
  currentFilePath = path || null;
  currentRawContent = raw || '';
  
  $('md-modal-title').textContent = title || '';
  $('md-modal-desc').textContent = description || '';
  $('md-modal-tags').innerHTML = tags?.length
    ? tags.map(t => `<span class="tag tag-${t.replace(/[^a-z]/g, '')}">${esc(t)}</span>`).join('')
    : '';

  const containers = ['md-modal-body', 'md-modal-edit', 'md-modal-iframe', 'md-modal-img'];
  containers.forEach(id => $(id).style.display = 'none');
  
  $('md-modal-external').style.display = url ? 'block' : 'none';
  if (url) $('md-modal-external').href = url;

  if (type === 'img') {
    $('md-modal-img').style.display = 'block';
    $('md-img').src = url;
    $('btn-edit').style.display = 'none';
  } else if (type === 'iframe') {
    $('md-modal-iframe').style.display = 'block';
    $('md-iframe').src = url;
    $('btn-edit').style.display = 'none';
  } else {
    $('md-modal-body').style.display = 'block';
    $('md-modal-body').innerHTML = html || '<p style="color:var(--muted)">Aucun contenu.</p>';
    $('editor-textarea').value = currentRawContent;
    $('btn-edit').style.display = currentFilePath ? 'block' : 'none';
    
    if (html && html.includes('<code')) {
      if (window.Prism) Prism.highlightAllUnder($('md-modal-body'));
    }
  }

  $('btn-edit').textContent = '✏️ Éditer';
  $('btn-save').style.display = 'none';
  $('md-modal').classList.add('open');
  if (type !== 'iframe' && type !== 'img') $('md-modal-body').scrollTop = 0;
}

export function closeMdModal() {
  $('md-modal').classList.remove('open');
  $('md-iframe').src = 'about:blank';
  $('md-img').src = '';
  currentFilePath = null;
}

export function toggleEditMode() {
  const isEditing = $('md-modal-edit').style.display === 'block';
  if (isEditing) {
    $('md-modal-body').style.display = 'block';
    $('md-modal-edit').style.display = 'none';
    $('btn-edit').textContent = '✏️ Éditer';
    $('btn-save').style.display = 'none';
  } else {
    $('md-modal-body').style.display = 'none';
    $('md-modal-edit').style.display = 'block';
    $('btn-edit').textContent = '🚫 Annuler';
    $('btn-save').style.display = 'block';
    $('editor-textarea').focus();
  }
}

export async function saveCurrentFile() {
  if (!currentFilePath) return;
  const content = $('editor-textarea').value;
  try {
    const res = await api('/api/explorer/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: currentFilePath, content })
    });
    if (res.ok) {
      showToast('✅ Fichier enregistré');
      currentRawContent = content;
      const ext = currentFilePath.split('.').pop().toLowerCase();
      if (ext === 'md') {
        $('md-modal-body').innerHTML = marked.parse(content);
      } else {
        const langMap = { js:'javascript', html:'markup', css:'css', json:'json' };
        const lang = langMap[ext] || 'clike';
        $('md-modal-body').innerHTML = `<pre class="language-${lang}"><code class="language-${lang}">${esc(content)}</code></pre>`;
        if (window.Prism) Prism.highlightAllUnder($('md-modal-body'));
      }
      toggleEditMode();
    }
  } catch (e) {
    alert('Erreur lors de la sauvegarde : ' + e.message);
  }
}

// Global modal events
$('md-modal').addEventListener('click', e => {
  if (e.target === $('md-modal')) closeMdModal();
});
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMdModal();
});
