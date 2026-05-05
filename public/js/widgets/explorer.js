// js/widgets/explorer.js
import { $, esc } from '../utils.js';
import { api } from '../api.js';
import { unifiedPreview } from '../preview.js';

let explorerRoot = '';

const EXT_ICON = { 
  '.md':'📝', '.html':'🌐', '.pdf':'📑', '.js':'📜', '.json':'📋',
  '.css':'🎨', '.py':'🐍', '.txt':'📄', '.png':'🖼', '.jpg':'🖼', '.svg':'🖼', '.db':'🗃' 
};

function xicon(entry) { return entry.type === 'dir' ? '📁' : (EXT_ICON[entry.ext] || '📄'); }
function trunc(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

async function explorerPreviewFile(path, name) {
  const rel = path.replace(explorerRoot, '').replace(/\\/g, '/');
  const url = '/workspace' + rel; 
  await unifiedPreview(path, name, url);
}

function makeNode(entry) {
  const li = document.createElement('li');

  if (entry.type === 'dir') {
    const summary = document.createElement('span');
    summary.className = 'xrow xdir';
    summary.innerHTML = `<span class="xtog">▶</span><span class="xic">${xicon(entry)}</span><span class="xnm">${trunc(entry.name, 40)}</span>`;

    const sub = document.createElement('ul');
    sub.className = 'xtree';
    sub.style.display = 'none';

    let loaded = false;
    summary.addEventListener('click', async () => {
      const open = sub.style.display === 'none';
      sub.style.display = open ? '' : 'none';
      summary.querySelector('.xtog').classList.toggle('open', open);

      if (open && !loaded) {
        loaded = true;
        sub.innerHTML = '<li style="padding:3px 0;color:var(--subtle);font-size:11px;list-style:none">  …</li>';
        try {
          const d = await api(`/api/explorer/children?path=${encodeURIComponent(entry.path)}`);
          sub.innerHTML = '';
          if (!d.entries?.length) {
            sub.innerHTML = '<li style="color:var(--subtle);font-size:11px;list-style:none;padding:2px 0">  vide</li>';
          } else {
            d.entries.forEach(c => sub.appendChild(makeNode(c)));
          }
        } catch { sub.innerHTML = '<li style="color:var(--red);font-size:11px;list-style:none">  erreur</li>'; }
      }
    });

    li.appendChild(summary);
    li.appendChild(sub);
  } else {
    const span = document.createElement('span');
    span.className = 'xrow xfile';
    span.innerHTML = `<span class="xic">${xicon(entry)}</span><span class="xnm">${trunc(entry.name, 40)}</span>`;
    span.addEventListener('click', () => explorerPreviewFile(entry.path, entry.name));
    li.appendChild(span);
  }

  return li;
}

export async function loadExplorer() {
  try {
    const data = await api('/api/explorer');
    explorerRoot = data.root || '';
    window.explorerRoot = explorerRoot; // Export for other widgets
    
    if ($('badge-explorer')) $('badge-explorer').textContent = data.entries.length;

    const ul = document.createElement('ul');
    ul.className = 'xtree root';
    data.entries.forEach(e => ul.appendChild(makeNode(e)));

    const body = $('body-explorer');
    if (body) {
        body.innerHTML = '';
        body.appendChild(ul);
    }
  } catch(e) {
    if ($('body-explorer')) $('body-explorer').innerHTML = `<div style="padding:14px;color:var(--red)">Erreur: ${e.message}</div>`;
  }
}

export function openExplorerRoot() { 
  api(`/api/explorer/open?path=${encodeURIComponent(explorerRoot)}`); 
}

window.openExplorerRoot = openExplorerRoot;
