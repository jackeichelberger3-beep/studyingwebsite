/* assets/pages.js
   Central templates, GAME_LIBRARY, EMBED_PRESETS, and DEV_LOG.
   Edit the marked arrays (searchable markers) to change pages/content.
*/

/* Helper escape */
function escapeHtml(s){
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ===== EMBED_PRESETS START (SEARCH: EMBED_PRESET) =====
   Simple presets for embed pages. Add as many as needed.
*/
const EMBED_PRESETS = [
  // PAGE: EMBED_PRESET: game1 — "Example Game"
  { key: 'game1', label: 'Example Game', url: 'https://example.com', sandbox: 'allow-scripts allow-same-origin', preview: true }
];
/* ===== EMBED_PRESETS END ===== */

/* ===== GAME_LIBRARY START (SEARCH: GAME_LIBRARY) =====
   Code-edit-only permanent game library. Add entries here.
   Each entry becomes a route: #/game/<key>
*/
const GAME_LIBRARY = [
  // PAGE: GAME_LIB: cool-game — "Cool Game"
  {
    key: 'cool-game',
    name: 'Cool Game',
    type: 'url',                     // 'url' or 'html'
    url: 'https://example.com',      // used for iframe / open-in-new-tab (NOT displayed in UI)
    html: '',                        // for type 'html' put full HTML here
    description: 'Demo URL-based game preset (edit GAME_LIBRARY in assets/pages.js).',
    sandbox: 'allow-scripts allow-same-origin',
    preview: true
  },

  // PAGE: GAME_LIB: demo-html — "Demo HTML Game"
  {
    key: 'demo-html',
    name: 'Demo HTML Game',
    type: 'html',
    url: '',
    html: '<!doctype html><html><body style=\"background:#111;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif\"><div><h1>Demo HTML Game</h1><button onclick=\"alert(\\'Hello!\\')\">Click</button></div></body></html>',
    description: 'A small in-code HTML demo — edit GAME_LIBRARY to change content.',
    sandbox: 'allow-scripts allow-same-origin',
    preview: true
  }
];
/* ===== GAME_LIBRARY END ===== */

/* ===== DEV_LOG START (SEARCH: DEV_LOG) =====
   Code-only developer changelog.
*/
const DEV_LOG = [
  // PAGE: DEV_LOG: 2026-08-16 — Initial
  { date: '2026-08-16', version: 'v1.0', title: 'Initial', summary: 'Core site and library scaffolding added.', details: ['Initial templates', 'Game library', 'Embed features'] }
];
/* ===== DEV_LOG END ===== */

/* TEMPLATES object: each function returns { title, subtitle, html } */
window.TEMPLATES = window.TEMPLATES || {};

/* Home */
window.TEMPLATES.home = function(){
  return {
    title: 'Home',
    subtitle: 'Sleek · Simple · Dark',
    html: `
      <article>
        <h2>Welcome</h2>
        <p>This site uses code-first templates. Edit <code>assets/pages.js</code> to change content (search for GAME_LIBRARY, EMBED_PRESET, DEV_LOG).</p>
      </article>
    `
  };
};

/* Info (supports query params title / subtitle /content) */
window.TEMPLATES.info = function(params){
  const title = params.title ? decodeURIComponent(params.title) : 'Information';
  const subtitle = params.subtitle ? decodeURIComponent(params.subtitle) : '';
  const content = params.content ? decodeURIComponent(params.content) : 'Edit TEMPLATES.info in assets/pages.js';
  return {
    title,
    subtitle,
    html: `<article><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(subtitle)}</p><div>${escapeHtml(content).replace(/\n/g,'<br>')}</div></article>`
  };
};

/* Free-form embed: #/embed?u=... */
window.TEMPLATES.embed = function(params){
  const url = params.u ? decodeURIComponent(params.u) : '';
  const sandbox = params.sandbox ? decodeURIComponent(params.sandbox) : 'allow-scripts allow-same-origin';
  const preview = params.preview === '1';
  return {
    title: url ? `Embed: ${url}` : 'Embed URL',
    subtitle: 'Paste or prefill with a URL. If embedding is blocked, use Open in new tab.',
    html: `
      <article>
        <h2>Embed URL (Free-form)</h2>
        <div class="form-row">
          <input id="embedUrl" type="text" placeholder="https://example.com" value="${escapeHtml(url)}" />
          <button id="embedLoad">Load</button>
        </div>
        <div class="form-row" style="margin-top:8px;">
          <label class="small">Sandbox:</label>
          <select id="embedSandbox">
            <option value="allow-scripts allow-same-origin"${sandbox==='allow-scripts allow-same-origin'?' selected':''}>allow-scripts allow-same-origin</option>
            <option value="allow-scripts"${sandbox==='allow-scripts'?' selected':''}>allow-scripts</option>
            <option value="">none</option>
          </select>
          <button id="embedPreviewToggle">${preview ? 'Hide Preview' : 'Show Preview'}</button>
          <button id="embedNewTab">Open in new tab</button>
        </div>
        <div id="embedMessage" class="small" style="margin-top:8px;color:var(--muted)">${url ? 'Loaded from hash.' : 'Enter a URL and press Load.'}</div>
        <div id="embedArea" class="link-preview" style="margin-top:12px;display:${preview? 'block':'none'}">
          <iframe id="embedFrame" src="${escapeHtml(url)}" title="Embed preview" sandbox="${escapeHtml(sandbox)}"></iframe>
        </div>
      </article>
    `
  };
};

/* Embed raw HTML (paste/upload) */
window.TEMPLATES.html = function(params){
  const contentParam = params.content ? decodeURIComponent(params.content) : '';
  return {
    title: 'Embed HTML',
    subtitle: 'Paste raw HTML or upload a .html file, then Render.',
    html: `
      <article>
        <h2>Embed HTML</h2>
        <div style="margin-top:8px;">
          <textarea id="htmlSource" rows="10" style="width:100%;background:#0b0b0b;border:1px solid rgba(255,255,255,0.04);color:#e6e6e6;padding:8px;border-radius:6px" placeholder="Paste full HTML...">${escapeHtml(contentParam)}</textarea>
        </div>
        <div class="form-row">
          <input id="htmlFile" type="file" accept=".html,text/html" />
          <button id="htmlRender">Render</button>
          <button id="htmlOpen">Open in new tab</button>
          <label class="small" style="margin-left:auto">Sandbox:
            <select id="htmlSandbox" style="margin-left:6px">
              <option value="allow-scripts allow-same-origin">allow-scripts allow-same-origin</option>
              <option value="allow-scripts">allow-scripts</option>
              <option value="">none</option>
            </select>
          </label>
        </div>
        <div id="htmlMsg" class="small" style="margin-top:8px;color:var(--muted)">No preview yet.</div>
        <div id="htmlPreview" class="link-preview" style="margin-top:12px;display:none">
          <iframe id="htmlFrame" src="" title="HTML preview" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
      </article>
    `
  };
};

/* URLs list (includes EMBED_PRESETS links) */
window.TEMPLATES.urls = function(){
  const examples = [{label:'Example.com', url:'https://example.com'}];
  const exampleHtml = examples.map(e => `<li><a href="#/embed?u=${encodeURIComponent(e.url)}&preview=1">${escapeHtml(e.label)} — ${escapeHtml(e.url)}</a></li>`).join('');
  const presetsHtml = EMBED_PRESETS.map(p => `<li><a href="#/embed/${encodeURIComponent(p.key)}">${escapeHtml(p.label)} — preset</a></li>`).join('');
  return {
    title: 'URLs',
    subtitle: 'Examples and presets',
    html: `<article><h2>URL Examples</h2><ul>${exampleHtml}${presetsHtml?'<hr>'+presetsHtml:''}</ul></article>`
  };
};

/* Games library index */
window.TEMPLATES.games = function(){
  const items = GAME_LIBRARY.map(it => `<li><a href="#/game/${encodeURIComponent(it.key)}">${escapeHtml(it.name)}</a> — ${escapeHtml(it.description)}</li>`).join('');
  return {
    title: 'Games Library',
    subtitle: 'Edit GAME_LIBRARY in assets/pages.js',
    html: `<article><h2>Games Library</h2><ul>${items}</ul><p class="editable-hint">Search GAME_LIBRARY to edit entries.</p></article>`
  };
};

/* Developer log (code-only) */
window.TEMPLATES.devlog = function(){
  const items = (DEV_LOG||[]).slice().reverse().map(e => {
    const details = (e.details||[]).map(d=>`<li>${escapeHtml(d)}</li>`).join('');
    return `<section style="margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.03)"><div style="display:flex;justify-content:space-between"><div><strong>${escapeHtml(e.title)}</strong><div class="small">${escapeHtml(e.summary)}</div></div><div style="text-align:right;color:var(--muted);font-family:monospace">${escapeHtml(e.date)}<div>${escapeHtml(e.version||'')}</div></div></div>${details?'<ul style="margin-top:10px">'+details+'</ul>':''}</section>`;
  }).join('');
  return { title:'Developer Log', subtitle:'Code changelog (DEV_LOG)', html:`<article><h2>Developer Log</h2>${items||'<div class="muted">No entries.</div>'}</article>` };
};

/* Register dynamic routes for EMBED_PRESETS (route: embed/<key>) */
EMBED_PRESETS.forEach(p => {
  const routeKey = `embed/${p.key}`;
  window.TEMPLATES[routeKey] = function(){ 
    const url = p.url || '';
    const sandbox = p.sandbox || 'allow-scripts allow-same-origin';
    const preview = p.preview ? true : false;
    return {
      title: p.label || `Embed ${p.key}`,
      subtitle: 'Preset embed (edit EMBED_PRESETS in assets/pages.js)',
      html: `
        <article>
          <h2>${escapeHtml(p.label)}</h2>
          <p class="muted">Preset embed (URL is stored in code and not shown).</p>
          <div class="form-row">
            <input id="embedUrl" type="text" value="${escapeHtml(url)}" />
            <button id="embedLoad">Load</button>
          </div>
          <div class="form-row" style="margin-top:8px;">
            <label class="small">Sandbox:</label>
            <select id="embedSandbox">
              <option value="allow-scripts allow-same-origin"${sandbox==='allow-scripts allow-same-origin'?' selected':''}>allow-scripts allow-same-origin</option>
              <option value="allow-scripts"${sandbox==='allow-scripts'?' selected':''}>allow-scripts</option>
              <option value="">none</option>
            </select>
            <button id="embedPreviewToggle">${preview ? 'Hide Preview':'Show Preview'}</button>
            <button id="embedNewTab">Open in new tab</button>
          </div>
          <div id="embedMessage" class="small" style="margin-top:8px;color:var(--muted)">Preset loaded from code.</div>
          <div id="embedArea" class="link-preview" style="margin-top:12px;display:${preview?'block':'none'}">
            <iframe id="embedFrame" src="${escapeHtml(url)}" title="${escapeHtml(p.label)}" sandbox="${escapeHtml(sandbox)}"></iframe>
          </div>
        </article>
      `
    };
  };
});

/* Register dynamic routes for GAME_LIBRARY (route: game/<key>) */
GAME_LIBRARY.forEach(entry => {
  const routeKey = `game/${entry.key}`;
  window.TEMPLATES[routeKey] = function(){
    const preview = entry.preview ? true : false;
    const sandbox = entry.sandbox || 'allow-scripts allow-same-origin';
    const isHtml = entry.type === 'html';
    return {
      title: entry.name || entry.key,
      subtitle: 'Library page (edit GAME_LIBRARY in assets/pages.js)',
      html: `
        <article>
          <h2>${escapeHtml(entry.name)}</h2>
          <p class="muted">${escapeHtml(entry.description||'')}</p>
          <div class="form-row" style="margin-top:10px;">
            <button id="gameLoadBtn">${preview?'Reload Preview':'Load'}</button>
            <button id="gameNewTabBtn">Open in new tab</button>
            <label class="small" style="margin-left:12px;">Dev-mode:
              <input id="gameAllowUnsafe" type="checkbox" style="margin-left:6px;" />
            </label>
          </div>
          <div id="gameWarning" style="margin-top:8px;color:#ffb4b4;display:none;border-left:4px solid #ff6b6b;padding:8px;border-radius:6px;background:rgba(255,100,100,0.03)">
            <strong>Warning:</strong> Allow unsafe removes sandbox restrictions. Only enable for trusted content.
          </div>
          <div id="gameArea" class="link-preview" style="margin-top:12px;display:${preview?'block':'none'}">
            <iframe id="gameIframe" src="" title="${escapeHtml(entry.name)}" sandbox="${escapeHtml(sandbox)}" style="width:100%;height:620px;border:0;"></iframe>
          </div>
          <p class="editable-hint">Game key: <code>${escapeHtml(entry.key)}</code> — edit GAME_LIBRARY to change.</p>
        </article>
      `
    };
  };
  // alias short route
  window.TEMPLATES[`g/${entry.key}`] = window.TEMPLATES[`game/${entry.key}`];
});

/* End of assets/pages.js */  // Add your new entries below. Copy the object and update date/version/title/summary/details.
];
/* ===== DEV_LOG END ===== */

/* Add render function for devlog route (non-template log page) */
window.TEMPLATES = window.TEMPLATES || {};

window.TEMPLATES.devlog = function(params) {
  // Render entries in reverse chronological order (newest first)
  const items = (DEV_LOG || []).slice().reverse().map(entry => {
    const detailsHtml = (entry.details || []).map(d => `<li>${escapeHtml(d)}</li>`).join('');
    return `
      <section style="margin-bottom:18px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.03)">
        <div style="display:flex;gap:12px;align-items:center;justify-content:space-between">
          <div>
            <strong style="font-size:15px">${escapeHtml(entry.title)}</strong>
            <div class="small" style="margin-top:4px">${escapeHtml(entry.summary)}</div>
          </div>
          <div style="text-align:right;color:var(--muted);font-family:monospace">
            <div>${escapeHtml(entry.date)}</div>
            <div style="margin-top:6px">${escapeHtml(entry.version || '')}</div>
          </div>
        </div>
        ${entry.details && entry.details.length ? `<ul style="margin-top:10px">${detailsHtml}</ul>` : ''}
      </section>
    `;
  }).join('');

  return {
    title: 'Developer Log',
    subtitle: 'Code-edit changelog (search "DEV_LOG" in assets/pages.js to edit)',
    html: `
      <article>
        <h2>Developer Log</h2>
        <p class="muted">This changelog is stored in code (assets/pages.js). Edit the <code>DEV_LOG</code> array to add entries. This is not a reusable template.</p>
        ${items || '<div class="muted">No log entries yet. Add entries to DEV_LOG in assets/pages.js.</div>'}
      </article>
    `
  };
};

// alias
window.TEMPLATES.dl = window.TEMPLATES.devlog;
