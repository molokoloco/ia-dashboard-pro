// js/widgets/skills.js
import { $, esc, showToast } from '../utils.js';
import { api } from '../api.js';
import { openMdModal } from '../ui.js';

let allSkills = [];
const CAT_ICON = {
  'Contenu & Rédaction': '✍️', 'CV & Carrière': '💼', 'Documents & Fichiers': '📁',
  'Design & Visuel': '🎨', 'Dev & Tech': '⚙️', 'Business & Marketing': '📈',
  'Skills & Claude': '🧩', 'Autre': '📦',
};

export async function loadSkills() {
  allSkills = await api('/api/skills');
  renderSkills(allSkills);
  if ($('badge-skills')) $('badge-skills').textContent = `${allSkills.length} skills`;
}

export function renderSkills(skills) {
  const body = $('body-skills');
  if (!body) return;
  if (!skills.length) { body.innerHTML = '<div class="empty" style="padding:20px">Aucun skill trouvé</div>'; return; }

  const byCategory = {};
  skills.forEach(s => { (byCategory[s.category] = byCategory[s.category] || []).push(s); });

  const ul = document.createElement('ul');
  ul.className = 'xtree root';

  for (const [cat, items] of Object.entries(byCategory)) {
    const catIcon = CAT_ICON[cat] || '📦';
    const li = document.createElement('li');

    const summary = document.createElement('span');
    summary.className = 'xrow xdir';
    summary.innerHTML = `<span class="xtog open">▶</span><span class="xic">${catIcon}</span><span class="xnm">${esc(cat)}</span><span style="font-size:10px;color:var(--subtle);margin-left:4px">(${items.length})</span>`;

    const sub = document.createElement('ul');
    sub.className = 'xtree';
    sub.style.display = '';

    summary.addEventListener('click', () => {
      const open = sub.style.display === 'none' ? '' : 'none';
      sub.style.display = open;
      summary.querySelector('.xtog').classList.toggle('open', open === '');
    });

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

export async function openSkillPreview(name) {
  const data = await api(`/api/skills/${name}`);
  openMdModal({ title: name.replace(/-/g, ' '), description: data.description, tags: [data.category || 'skill'], html: data.html });
}

// Setup search
if ($('skills-search')) {
    $('skills-search').addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        renderSkills(!q ? allSkills : allSkills.filter(s =>
          s.name.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q) || (s.category||'').toLowerCase().includes(q)
        ));
    });
}
