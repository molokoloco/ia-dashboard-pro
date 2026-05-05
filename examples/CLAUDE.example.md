# CLAUDE.md — yoursite.com × Claude Code

> Behavioral guide + critical rules. Deep reference → PLAYBOOK.md.

> ⚠️ **This is an anonymized example file.**
> Replace every `YOUR_*` / `yoursite.com` / `your_*` placeholder with your own values before use.
> The original lives at the root of your Claude workspace as `CLAUDE.md` (gitignored).

---

## Project

Personal website of Your Name (web expert since YYYY, Your City).
Stack: WordPress + Elementor Pro + Yoast SEO + YOUR_HOST WAF.
Multi-subproject workspace: dashboard, scraper, scrap (Twitter), articles, CV, wiki.

## Stack

| Layer | Tech |
|-------|------|
| CMS | WordPress + Elementor Pro |
| SEO | Yoast SEO + Code Snippets plugin |
| Host | YOUR_HOST (WAF active) |
| Local | Local by Flywheel (yoursitelocal.local) |
| Dashboard | Express + SQLite + vanilla JS (port 3001) |
| Scripts | Node.js (no TypeScript) |
| Scraper | Node.js + Playwright |

## Commands

```bash
npm run dashboard          # Start dashboard http://localhost:3001
node export_wiki.js        # Export WP → wiki/ markdown
node scripts/generate_NAME.js   # Generate Elementor JSON
node scripts/create_NAME.js     # Create WP page + inject metas
cd scraper && npm run scan     # Lead scraper multi-sources
cd scraper && npm run enrich   # Merge + enrichment
cd scrap && node fetchTweetsPlaywright.js  # Twitter scraper
```

## Architecture

```
Claude/
├── CLAUDE.md              ← This file
├── PLAYBOOK.md            ← Deep reference (workflows, API patterns, history)
├── dashboard/             ← Local app port 3001 (Express + SQLite)
│   ├── server.js, db.js, dashboard.db, sessions-log.json
│   └── api/               ← 11 route modules
├── wiki/                  ← WP export markdown (articles/ + pages/ + prompts/)
├── articles/              ← Draft articles (.md)
├── exports-elementor/     ← Generated Elementor JSONs (current/ lib/ archive/)
├── scripts/               ← Node.js WP automation scripts
├── scraper/               ← Lead Scraper Pro (B2B prospection)
├── scrap/                 ← Twitter/X scraper (Playwright)
├── cv/                    ← CVs + cover letters
├── Projects/              ← Active projects
├── medias/                ← Visual assets + index.json
└── graphify-out/          ← Knowledge graph
```

---

## Behavior Rules

### Think before coding
- State assumptions explicitly. If uncertain, ask.
- Multiple interpretations → present them, don't pick silently.
- Simpler approach exists → say so, push back.
- Unclear → stop, name what's confusing, ask.

### Simplicity first
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No error handling for impossible scenarios.

### Surgical changes
- Don't "improve" adjacent code unless asked.
- Don't refactor things that aren't broken.
- Match existing style.
- Every changed line must trace directly to the request.

---

## Critical Rules (incidents → hard limits)

### Elementor
- **NEVER inject `_elementor_data` via REST API or Code Snippets PHP** → site corruption
- Elementor import = manual UI only: WP Admin → Edit with Elementor → Import template
- `_elementor_page_template = "theme"` is MANDATORY for sidebar/Theme Builder
- Containers racine: `isInner: false`, `type: 'page'`, `version: '0.4'`

### WAF YOUR_HOST
- ALL requests must include `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36`
- DELETE method blocked → deletions done MANUALLY in WP Admin
- Binary media upload → multipart/form-data with boundary (not raw binary)
- Cache bypass → append `?nocache=` + timestamp

### PHP in Code Snippets
- Always escape apostrophes in single-quoted PHP strings: `'l\'IA'`, `'d\'un'`
- Unescaped `'` breaks PHP silently with no detectable API error
- Test with `?nocache=timestamp` to bypass WP Super Cache

### Yoast SEO metas
- `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`, `_yoast_wpseo_title` → NOT exposed natively in REST API
- Update via Code Snippets PHP (`update_post_meta`) only

### Dashboard (port 3001)
- Port 3001 is reserved for dashboard — don't start other servers there
- Log every session end: `POST http://localhost:3001/api/sessions`
- UTF-8 sessions-log: write via curl or Node.js ONLY — never raw PowerShell (corrupts accents/emojis)

---

## WP API Template (Node.js)

```js
const https = require('https');
const AUTH = Buffer.from('your_wp_username:xxxx xxxx xxxx xxxx xxxx xxxx').toString('base64');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'yoursite.com', path, method,
      headers: {
        'Authorization': 'Basic ' + AUTH, 'User-Agent': UA,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const r = https.request(options, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, data: d }); } });
    });
    r.on('error', reject);
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}
```

Local (yoursitelocal.local): use `rejectUnauthorized: false` + App Password `yyyy yyyy yyyy yyyy yyyy yyyy`.

---

## Out of Scope (don't touch without asking)

- `exports-elementor/` → manually maintained, don't auto-overwrite
- `dashboard/dashboard.db` → SQLite, don't drop/reset
- `sessions-log.json` → append only via API
- `scraper/chrome_scraper_profile/` → persistent Chrome session, don't delete
- `wiki/` → generated by `export_wiki.js`, don't edit manually

---

## Wrap-up Protocol (trigger: "wrap up" / "fin de session" / "synthèse")

Run this checklist when user signals end of session:

### 1 — Synthesize
Write 3-5 bullet points: what was done, what changed, files touched.

### 2 — Update memory
Check `C:/Users/yourname/.claude/projects/YOUR_PROJECT_ID/memory/`.
Update or create relevant memory files (user, feedback, project, reference).
Update `MEMORY.md` index if new files added.

### 3 — Check PLAYBOOK.md
For each section touched this session: is it still accurate?
Flag outdated content with `⚠️ À mettre à jour` inline, or update directly if simple.

### 4 — Post session to dashboard
```bash
curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"TITRE\",\"summary\":\"RÉSUMÉ\",\"actions\":[\"action1\",\"action2\"],\"files\":[\"file1\"]}"
```

### 5 — Post remaining todos
```bash
curl -s -X POST http://localhost:3001/api/todos \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"TODO\",\"priority\":\"high\"}"
```

---

## graphify

Knowledge graph at `graphify-out/`.

- Before answering architecture/codebase questions → read `graphify-out/GRAPH_REPORT.md`
- After modifying code files → run `graphify update .`

---

*This file is part of the Claude × yoursite.com working directory.*
