// js/preview.js
import { api } from './api.js';
import { esc } from './utils.js';
import { openMdModal } from './ui.js';

export async function unifiedPreview(path, name, url) {
  const ext = (path || url || '').split('.').pop().toLowerCase();
  const textExtensions = ['md', 'js', 'json', 'css', 'txt', 'php'];
  const imgExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'];
  
  if (textExtensions.includes(ext)) {
    try {
      const d = await api(`/api/explorer/read?path=${encodeURIComponent(path)}`);
      const content = d.content || '';
      let html = '';
      if (ext === 'md') {
        html = marked.parse(content);
      } else {
        const langMap = { js:'javascript', css:'css', json:'json', php:'php' };
        const lang = langMap[ext] || 'clike';
        html = `<pre class="language-${lang}"><code class="language-${lang}">${esc(content)}</code></pre>`;
      }
      openMdModal({ title: name, html, raw: content, path, url });
    } catch (e) {
      openMdModal({ title: name, html: `<p style="color:var(--red)">Erreur lecture: ${e.message}</p>` });
    }
  } else if (imgExtensions.includes(ext)) {
    openMdModal({ title: name, type: 'img', url: url || path });
  } else if (ext === 'pdf' || ext === 'html') {
    openMdModal({ title: name, type: 'iframe', url: url || path });
  } else {
    // Tenter ouverture système pour le reste
    fetch(`/api/explorer/open?path=${encodeURIComponent(path)}`);
  }
}
