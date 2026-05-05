// js/utils.js
export const $ = id => document.getElementById(id);

export function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmtDate(str) {
  if (!str) return '–';
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relDate(str) {
  if (!str) return '–';
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

export function fmtSize(bytes) {
  if (!bytes) return '–';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' Mo';
  return Math.round(bytes / 1024) + ' Ko';
}

export function showToast(msg) {
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

export function renderTags(tags) {
  if (!tags || !tags.length) return '';
  return `<div class="a-meta" style="margin-top:4px;">
    ${tags.map(t => `<span class="a-tag">#${esc(t.trim().replace(/\s+/g,'_'))}</span>`).join('')}
  </div>`;
}
