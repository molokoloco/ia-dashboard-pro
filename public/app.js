// ── Clock ────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    + ' · ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
updateClock();
setInterval(updateClock, 30000);

// ── Utils ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const api = async (url, opts) => {
  const res = await fetch(url, opts);
  return res.json();
};
function relDate(str) {
  const d = new Date(str);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `il y a ${days}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function fmtDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtSize(bytes) {
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' Mo';
  return Math.round(bytes / 1024) + ' Ko';
}
function statusClass(s) {
  return 'status status-' + (s || 'envoyée').replace(/\s/g, '-');
}
function renderTags(tags) {
  if (!tags?.length) return '';
  return `<div class="tags">${tags.map(t => `<span class="tag tag-${t.replace(/[^a-z]/g, '')}">${esc(t)}</span>`).join('')}</div>`;
}
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Modal Markdown générique ──────────────────────────────
function openMdModal({ title, description, tags, html }) {
  $('md-modal-title').textContent = title || '';
  $('md-modal-desc').textContent = description || '';
  $('md-modal-tags').innerHTML = tags?.length
    ? tags.map(t => `<span class="tag tag-${t.replace(/[^a-z]/g, '')}">${esc(t)}</span>`).join('')
    : '';
  $('md-modal-body').innerHTML = html || '<p style="color:var(--muted)">Aucun contenu.</p>';
  $('md-modal').classList.add('open');
  $('md-modal-body').scrollTop = 0;
}
function closeMdModal() {
  $('md-modal').classList.remove('open');
}
$('md-modal').addEventListener('click', e => {
  if (e.target === $('md-modal')) closeMdModal();
});

// ── TODO ──────────────────────────────────────────────────
let todos = [];

async function loadTodos() {
  todos = await api('/api/todos');
  renderTodos();
}
function renderTodos() {
  const body = $('body-todo');
  const pending = todos.filter(t => !t.done);
  $('badge-todo').textContent = `${pending.length} en cours`;
  if (!todos.length) { body.innerHTML = '<div class="empty">Aucune tâche</div>'; return; }
  const PRIORITY_ICON = { haute: '🔴', normal: '🔵', basse: '⚪' };
  body.innerHTML = todos.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" id="todo-${t.id}">
      <input type="checkbox" id="chk-${t.id}" ${t.done ? 'checked' : ''}
        onchange="toggleTodo(${t.id}, this.checked)">
      <label for="chk-${t.id}">${PRIORITY_ICON[t.priority] || '🔵'} ${esc(t.title)}</label>
      <button class="btn-icon" onclick="deleteTodo(${t.id})" title="Supprimer">×</button>
    </div>
  `).join('');
}
async function addTodo() {
  const input = $('todo-input');
  const priority = $('todo-priority').value;
  const title = input.value.trim();
  if (!title) return;
  await api('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority }),
  });
  input.value = '';
  loadTodos();
}
async function toggleTodo(id, done) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  await api(`/api/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done, title: todo.title, priority: todo.priority }),
  });
  loadTodos();
}
async function deleteTodo(id) {
  await api(`/api/todos/${id}`, { method: 'DELETE' });
  loadTodos();
}
$('todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

// ── CVs + CANDIDATURES (fusionnés, triés par date) ────────
const CAND_STATUS = ['envoyée', 'en attente', 'entretien', 'refusée', 'acceptée'];

async function loadCandidatures() {
  const [cands, cvs] = await Promise.all([
    api('/api/candidatures'),
    api('/api/cv'),
  ]);
  const body = $('body-cand');

  // Fusionner : candidatures + CVs en items unifiés
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

  $('badge-cand').textContent = `${cvs.length} CVs · ${cands.length} offres`;

  if (!items.length) { body.innerHTML = '<div class="empty">Aucun fichier</div>'; return; }

  body.innerHTML = items.map(item => {
    if (item._type === 'cv') return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">
            <a href="${item.url}" target="_blank">${esc(item.filename)}</a>
          </div>
          <div class="item-meta">${fmtDate(item._date)} · ${fmtSize(item.size)}</div>
        </div>
        <span class="type-pill">${item.ext}</span>
      </div>`;

    return `
      <div class="item">
        <div class="item-main">
          <div class="item-title">
            <a href="/static/offres/${encodeURIComponent(item.filename)}" target="_blank">
              ${esc(item.company || item.filename)}
            </a>
            ${item.role ? `<span style="color:var(--muted)"> · ${esc(item.role)}</span>` : ''}
          </div>
          <div class="item-meta">${fmtDate(item._date)}</div>
        </div>
        <select class="status ${statusClass(item.status)}"
          onchange="updateCandStatus(${item.id}, this.value, '${esc(item.company)}', '${esc(item.role)}', '${esc(item.note)}')">
          ${CAND_STATUS.map(s => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>`;
  }).join('');
}

async function updateCandStatus(id, status, company, role, note) {
  await api(`/api/candidatures/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, role, status, note }),
  });
  loadCandidatures();
}

// ── ARTICLES + WIKI (fusionnés) ───────────────────────────
async function loadArticles() {
  const [wpData, wikiData] = await Promise.all([
    api('/api/wordpress/posts?per_page=20'),
    api('/api/wiki'),
  ]);

  const body = $('body-articles');
  if (wpData.error) { body.innerHTML = `<div class="empty">Erreur WP : ${esc(wpData.error)}</div>`; return; }

  // Index wiki articles : clé = wpSlug (slug WP), valeur = article (avec fileSlug pour lookup API)
  const wikiIndex = {};
  (wikiData.articles || []).forEach(a => {
    const key = a.wpSlug || a.slug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
    wikiIndex[key] = a; // a.slug = filename avec date, pour l'API
  });

  const STATUS_ICON = { publish: '🟢', draft: '🟡', private: '🔒', pending: '🔵' };
  const total = wpData.length;
  const withWiki = wpData.filter(p => wikiIndex[p.slug]).length;
  $('badge-articles').textContent = `${total} articles · ${withWiki} wiki`;

  body.innerHTML = wpData.map(p => {
    const title = p.title?.rendered || '(sans titre)';
    const wikiMatch = wikiIndex[p.slug];

    // Tags catégories wiki si dispo
    let cats = wikiMatch?.categories || '';
    if (typeof cats === 'string') cats = cats.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    const tagsHtml = cats.length
      ? `<div class="tags" style="margin-top:4px;">${cats.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>`
      : '';

    const publicUrl = p.link || `https://julienweb.fr/${p.slug}/`;
    const shortUrl  = publicUrl.replace('https://julienweb.fr', '');

    return `
      <div class="item article-item">
        <div class="a-title">${STATUS_ICON[p.status] || '⚪'} ${esc(title)}</div>
        <div class="a-meta">
          <span class="a-date">${fmtDate(p.date)}</span>
          ${cats.map(c => `<span class="a-tag">#${esc(c.replace(/\s+/g,'_'))}</span>`).join('')}
        </div>
        <div class="a-actions">
          <a href="${publicUrl}" target="_blank" class="a-url" title="Voir l'article en ligne">
            <span class="a-url-icon">🌐</span><span class="a-url-text">${esc(shortUrl)}</span>
          </a>
          <a href="https://julienweb.fr/wp-admin/post.php?post=${p.id}&action=elementor"
             target="_blank" class="a-btn a-btn-edit" title="Éditer dans Elementor">✏️</a>
          ${wikiMatch
            ? `<button class="a-btn a-btn-wiki"
                 onclick="openWikiPreview('article','${esc(wikiMatch.slug)}','${esc(title).replace(/'/g,'&#39;')}')"
                 title="Lire le wiki">📖</button>`
            : `<span class="a-btn a-btn-disabled" title="Pas de fichier wiki">📖</span>`
          }
        </div>
      </div>`;
  }).join('');
}

async function openWikiPreview(type, slug, title) {
  const endpoint = type === 'article' ? `/api/wiki/articles/${slug}` : `/api/wiki/pages/${slug}`;
  const data = await api(endpoint);
  let tags = [];
  if (data.meta?.categories) {
    const raw = data.meta.categories;
    tags = (typeof raw === 'string' ? raw.replace(/[\[\]"]/g, '').split(',') : raw)
      .map(s => s.trim()).filter(Boolean);
  }
  openMdModal({ title: data.meta?.title || title, description: data.meta?.excerpt || '', tags, html: data.html });
}

// ── WORDPRESS ─────────────────────────────────────────────
async function loadWP() {
  const data = await api('/api/wordpress/posts?per_page=15');
  const body = $('body-wp');
  if (data.error) { body.innerHTML = `<div class="empty">Erreur : ${esc(data.error)}</div>`; return; }
  $('badge-wp').textContent = `${data.length} articles`;
  if (!data.length) { body.innerHTML = '<div class="empty">Aucun article</div>'; return; }
  const STATUS_LABEL = { publish: '🟢', draft: '🟡', private: '🔒', pending: '🔵' };
  body.innerHTML = data.map(p => `
    <div class="item">
      <div class="item-main">
        <div class="item-title">
          <a href="https://julienweb.fr/wp-admin/post.php?post=${p.id}&action=edit" target="_blank">
            ${esc(p.title?.rendered || '(sans titre)')}
          </a>
        </div>
        <div class="item-meta">${fmtDate(p.date)} · ${p.status}</div>
      </div>
      <span style="font-size:16px">${STATUS_LABEL[p.status] || '⚪'}</span>
    </div>
  `).join('');
}

// ── SESSIONS LOG ──────────────────────────────────────────
async function loadActions() {
  const data = await api('/api/sessions');
  const body = $('body-actions');
  $('badge-actions').textContent = `${data.length} session${data.length > 1 ? 's' : ''}`;

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

function showActionForm() {
  $('modal-action').style.display = 'flex';
  setTimeout(() => $('session-title-input')?.focus(), 50);
}
function hideActionForm() {
  $('modal-action').style.display = 'none';
  ['session-title-input','session-summary-input','session-actions-input','session-files-input']
    .forEach(id => { const el = $(id); if (el) el.value = ''; });
}
async function submitAction() {
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
  loadActions();
}
$('modal-action').addEventListener('click', e => { if (e.target === $('modal-action')) hideActionForm(); });

// ── DOCS & PRÉFÉRENCES ────────────────────────────────────
async function loadDocs() {
  const data = await api('/api/docs');
  const body = $('body-docs');
  $('badge-docs').textContent = `${data.length} fichiers`;
  if (!data.length) { body.innerHTML = '<div class="empty">Aucun fichier</div>'; return; }

  // Grouper par section
  const sections = {};
  data.forEach(doc => {
    const s = doc.section || 'Références';
    (sections[s] = sections[s] || []).push(doc);
  });

  const SECTION_ICON = { 'Références': '📌', 'Julien-ia': '🤖', 'cv': '📄' };

  body.innerHTML = Object.entries(sections).map(([sec, docs]) => `
    <div class="section-label" style="margin-top:10px;">${SECTION_ICON[sec] || '📁'} ${sec}</div>
    ${docs.map(doc => doc.type === 'pdf' ? `
      <div class="item">
        <div class="item-main">
          <div class="item-title"><a href="${doc.url}" target="_blank">📑 ${esc(doc.title)}</a></div>
          ${renderTags(doc.tags)}
        </div>
        <span class="type-pill">pdf</span>
      </div>
    ` : `
      <div class="item clickable" onclick="openDocPreview('${esc(doc.slug)}', '${esc(doc.title)}')">
        <div class="item-main">
          <div class="item-title">${esc(doc.title)}</div>
          ${doc.description ? `<div class="item-meta" style="margin-bottom:4px;">${esc(doc.description.slice(0, 90))}${doc.description.length > 90 ? '…' : ''}</div>` : ''}
          ${renderTags(doc.tags)}
        </div>
        <span class="type-pill">md</span>
      </div>
    `).join('')}
  `).join('');
}

async function openDocPreview(slug, title) {
  const data = await api(`/api/docs/${slug}`);
  openMdModal({ title: data.title || title, description: data.description, tags: data.tags, html: data.html });
}

// ── SKILLS ────────────────────────────────────────────────
let allSkills = [];
const CAT_ICON = {
  'Contenu & Rédaction': '✍️', 'CV & Carrière': '💼', 'Documents & Fichiers': '📁',
  'Design & Visuel': '🎨', 'Dev & Tech': '⚙️', 'Business & Marketing': '📈',
  'Skills & Claude': '🧩', 'Autre': '📦',
};

async function loadSkills() {
  allSkills = await api('/api/skills');
  renderSkills(allSkills);
  $('badge-skills').textContent = `${allSkills.length} skills`;
}

function renderSkills(skills) {
  const body = $('body-skills');
  if (!skills.length) { body.innerHTML = '<div class="empty" style="padding:20px">Aucun skill trouvé</div>'; return; }

  const byCategory = {};
  skills.forEach(s => { (byCategory[s.category] = byCategory[s.category] || []).push(s); });

  const ul = document.createElement('ul');
  ul.className = 'xtree root';

  for (const [cat, items] of Object.entries(byCategory)) {
    const catIcon = CAT_ICON[cat] || '📦';
    const li = document.createElement('li');

    // ── En-tête catégorie (dépliable) ──
    const summary = document.createElement('span');
    summary.className = 'xrow xdir';
    summary.innerHTML = `<span class="xtog open">▶</span><span class="xic">${catIcon}</span><span class="xnm">${esc(cat)}</span><span style="font-size:10px;color:var(--subtle);margin-left:4px">(${items.length})</span>`;

    const sub = document.createElement('ul');
    sub.className = 'xtree';
    // ouvert par défaut seulement si peu de catégories
    sub.style.display = '';

    summary.addEventListener('click', () => {
      const open = sub.style.display === 'none' ? '' : 'none';
      sub.style.display = open;
      summary.querySelector('.xtog').classList.toggle('open', open === '');
    });

    // ── Skills de la catégorie ──
    for (const s of items) {
      const sli = document.createElement('li');
      const row = document.createElement('span');
      row.className = 'xrow xskill';
      row.title = s.description || '';

      const nameEl = document.createElement('span');
      nameEl.className = 'xnm';
      nameEl.style.flex = '1';
      nameEl.textContent = s.name.replace(/-/g, ' ');

      const btnPreview = document.createElement('button');
      btnPreview.className = 'sk-btn';
      btnPreview.title = 'Lire le skill';
      btnPreview.textContent = '📝';
      btnPreview.onclick = e => { e.stopPropagation(); openSkillPreview(s.name); };

      const btnUse = document.createElement('button');
      btnUse.className = 'sk-btn';
      btnUse.title = 'Copier la commande';
      btnUse.textContent = '⚡';
      btnUse.onclick = e => {
        e.stopPropagation();
        const cmd = `Utilise le skill "${s.name}" pour cette tâche :`;
        navigator.clipboard.writeText(cmd).then(() => showToast(`⚡ Copié : ${s.name}`));
      };

      row.appendChild(nameEl);
      row.appendChild(btnPreview);
      row.appendChild(btnUse);
      sli.appendChild(row);
      sub.appendChild(sli);
    }

    li.appendChild(summary);
    li.appendChild(sub);
    ul.appendChild(li);
  }

  body.innerHTML = '';
  body.appendChild(ul);
}

function showToast(msg) {
  let t = document.getElementById('sk-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sk-toast';
    t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#5A4095;color:#fff;padding:8px 20px;border-radius:25px;font-size:13px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

$('skills-search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  renderSkills(!q ? allSkills : allSkills.filter(s =>
    s.name.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q)
  ));
});

async function openSkillPreview(name) {
  const data = await api(`/api/skills/${name}`);
  openMdModal({ title: name.replace(/-/g, ' '), description: data.description, tags: [data.category || 'skill'], html: data.html });
}

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeMdModal(); hideActionForm(); }
  if (e.key === 'Enter' && $('modal-action').style.display === 'flex') submitAction();
});

// ── Explorateur fichiers ──────────────────────────────────
let explorerRoot = '';

const EXT_ICON = { '.md':'📝','.html':'🌐','.pdf':'📑','.js':'📜','.json':'📋',
  '.css':'🎨','.py':'🐍','.txt':'📄','.png':'🖼','.jpg':'🖼','.svg':'🖼','.db':'🗃' };

function xicon(entry) { return entry.type==='dir' ? '📁' : (EXT_ICON[entry.ext]||'📄'); }
function trunc(s,n)   { return s.length>n ? s.slice(0,n-1)+'…' : s; }

// ── Viewer ────────────────────────────────────────────────
async function explorerPreviewFile(path, name, ext) {
  const rel  = path.replace(explorerRoot,'').replace(/\\/g,'/');
  const url  = 'http://localhost:3456' + rel;
  if (ext==='.md') {
    try {
      const d = await api(`/api/explorer/read?path=${encodeURIComponent(path)}`);
      openMdModal({ title: name.replace(/\.md$/,'').replace(/-/g,' '), html: marked.parse(d.content||'') });
    } catch { openMdModal({ title: name, html:'<p style="color:var(--red)">Erreur lecture</p>' }); }
  } else if (ext==='.html' || ext==='.pdf') {
    $('file-viewer-title').textContent = (ext==='.pdf'?'📑 ':'🌐 ') + name;
    $('file-viewer-link').href = url;
    $('file-viewer-frame').src = url;
    $('file-viewer').style.display = 'flex';
  } else {
    fetch(`/api/explorer/open?path=${encodeURIComponent(path)}`);
  }
}
function closeFileViewer() {
  $('file-viewer').style.display='none';
  $('file-viewer-frame').src='about:blank';
}

// ── Nœud <li> ─────────────────────────────────────────────
function makeNode(entry) {
  const li = document.createElement('li');

  if (entry.type === 'dir') {
    // ── Dossier ──
    const summary = document.createElement('span');
    summary.className = 'xrow xdir';
    summary.innerHTML = `<span class="xtog">▶</span><span class="xic">${xicon(entry)}</span><span class="xnm">${trunc(entry.name,40)}</span>`;

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
    // ── Fichier ──
    const span = document.createElement('span');
    span.className = 'xrow xfile';
    span.innerHTML = `<span class="xic">${xicon(entry)}</span><span class="xnm">${trunc(entry.name,40)}</span>`;
    span.addEventListener('click', () => explorerPreviewFile(entry.path, entry.name, entry.ext));
    li.appendChild(span);
  }

  return li;
}

// ── Init ──────────────────────────────────────────────────
async function loadExplorer() {
  try {
    const data = await api('/api/explorer');
    explorerRoot = data.root || '';
    $('badge-explorer').textContent = data.entries.length;

    const ul = document.createElement('ul');
    ul.className = 'xtree root';
    data.entries.forEach(e => ul.appendChild(makeNode(e)));

    const body = $('body-explorer');
    body.innerHTML = '';
    body.appendChild(ul);
  } catch(e) {
    $('body-explorer').innerHTML = `<div style="padding:14px;color:var(--red)">Erreur: ${e.message}</div>`;
  }
}
function openExplorerRoot() { fetch('/api/explorer/open'); }

// ── SCRIPTS ────────────────────────────────────────────────
async function loadScripts() {
  const data = await api('/api/scripts');
  const body = $('body-scripts');
  if (data.error) { body.innerHTML = `<div class="empty">Erreur : ${esc(data.error)}</div>`; return; }
  
  $('badge-scripts').textContent = `${data.length} scripts`;
  if (!data.length) { body.innerHTML = '<div class="empty">Aucun script trouvé</div>'; return; }

  body.innerHTML = data.map(s => `
    <div class="item">
      <div class="item-main">
        <div class="item-title">${esc(s.title)} <span style="font-size:11px;color:var(--muted);font-family:monospace;margin-left:6px;">${esc(s.name)}</span></div>
        <div class="item-meta" style="margin-top:2px;font-style:italic;">${esc(s.description)}</div>
      </div>
      <button class="sk-btn" title="Copier la commande" style="margin-right:8px;" onclick="copyScriptCmd('${esc(s.name)}')">⚡ Copier</button>
      <span class="type-pill">js</span>
    </div>
  `).join('');
}

function copyScriptCmd(scriptName) {
  const cmd = `node scripts/${scriptName}`;
  navigator.clipboard.writeText(cmd).then(() => {
    if (typeof showToast === 'function') showToast(`⚡ Copié : ${cmd}`);
  });
}

// ── Init + auto-refresh ───────────────────────────────────
function loadAll() {
  loadTodos();
  loadCandidatures();
  loadArticles();
  loadActions();
  loadDocs();
  loadScripts();
}

loadAll();
loadSkills();
loadExplorer();
setInterval(loadAll, 60000);
