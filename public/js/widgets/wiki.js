// js/widgets/wiki.js
import { $, esc } from '../utils.js';
import { api } from '../api.js';
import { openMdModal } from '../ui.js';

export async function loadWiki() {
  const [wpData, wikiData] = await Promise.all([
    api('/api/wordpress/posts?per_page=20').catch(() => []),
    api('/api/wiki').catch(() => ({ articles: [], pages: [] })),
  ]);

  const body = $('body-articles');
  if (!body) return;

  const wikiIndex = {};
  (wikiData.articles || []).forEach(a => {
    const key = a.wpSlug || a.slug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
    wikiIndex[key] = a;
  });

  const STATUS_ICON = { publish: '🟢', draft: '🟡', private: '🔒', pending: '🔵' };
  const total = wpData.length || 0;
  const withWiki = wpData.filter(p => wikiIndex[p.slug]).length;
  
  if ($('badge-articles')) $('badge-articles').textContent = `${total} articles · ${withWiki} wiki`;

  if (!wpData.length) {
    body.innerHTML = '<div class="empty">Aucun article trouvé</div>';
    return;
  }

  body.innerHTML = wpData.map(p => {
    const title = p.title?.rendered || '(sans titre)';
    const wikiMatch = wikiIndex[p.slug];

    let cats = wikiMatch?.categories || '';
    if (typeof cats === 'string') cats = cats.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);

    const publicUrl = p.link || `https://julienweb.fr/${p.slug}/`;
    const shortUrl  = publicUrl.replace('https://julienweb.fr', '');

    return `
      <div class="item article-item">
        <div class="a-title">${STATUS_ICON[p.status] || '⚪'} ${esc(title)}</div>
        <div class="a-meta">
          <span class="a-date">${new Date(p.date).toLocaleDateString()}</span>
          ${cats.map(c => `<span class="a-tag">#${esc(c.replace(/\s+/g,'_'))}</span>`).join('')}
        </div>
        <div class="a-actions">
          <a href="${publicUrl}" target="_blank" class="a-url" title="Voir l'article en ligne">
            <span class="a-url-icon">🌐</span><span class="a-url-text">${esc(shortUrl)}</span>
          </a>
          <a href="https://julienweb.fr/wp-admin/post.php?post=${p.id}&action=elementor"
             target="_blank" class="a-btn a-btn-edit" title="Éditer dans Elementor">✏️</a>
          ${wikiMatch
            ? `<button class="a-btn a-btn-wiki" data-slug="${esc(wikiMatch.slug)}" data-title="${esc(title)}" title="Lire le wiki">📖</button>`
            : `<span class="a-btn a-btn-disabled" title="Pas de fichier wiki">📖</span>`
          }
        </div>
      </div>`;
  }).join('');

  body.querySelectorAll('.a-btn-wiki').forEach(btn => {
    btn.onclick = () => openWikiPreview('article', btn.dataset.slug, btn.dataset.title);
  });
}

export async function openWikiPreview(type, slug, title) {
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

window.openWikiPreview = openWikiPreview;
