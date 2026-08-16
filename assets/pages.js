/* assets/pages.js
   ADD EMBED PRESETS BELOW to create named embed pages.
   - Search with Ctrl+F for "EMBED_PRESET" or "PAGE: EMBED_PRESET" to find your pages quickly.
   - To add another preset, add an object to EMBED_PRESETS with a unique 'key'.
   - Each preset creates a route: #/embed/<key> (example: #/embed/game1)
   - Edit the 'url' value below to point to your game/site.
*/

/* Helper: escape HTML for safe insertion */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* ===== EMBED PRESETS START (SEARCH: EMBED_PRESET) =====
   Add as many preset objects as you want to this array.
   Fields:
     - key: unique path segment (used in URL: #/embed/<key>)
     - label: human-friendly name (displayed in lists)
     - url: the URL to embed (change this in-code to update)
     - sandbox: default sandbox string for iframe (can be empty)
     - preview: boolean, whether to auto-show preview
   Example route: #/embed/game1
*/
const EMBED_PRESETS = [
  // PAGE: EMBED_PRESET: game1 — "Cool Game (example)"
  { key: 'game1', label: 'Cool Game (example)', url: 'https://example.com', sandbox: 'allow-scripts allow-same-origin', preview: true },

  // PAGE: EMBED_PRESET: phaser-demo — "Phaser Demo (example)"
  { key: 'phaser-demo', label: 'Phaser Demo (example)', url: 'https://phaser.io', sandbox: 'allow-scripts allow-same-origin', preview: false }

  // Add new presets below — copy a line above and change key/label/url.
];
/* ===== EMBED PRESETS END ===== */

window.TEMPLATES = window.TEMPLATES || {};

/* Basic pages (home, info, free embed, html, urls). Keep these if you want free-form behavior. */

window.TEMPLATES.home = function(params) {
  return {
    title: 'Home',
    subtitle: 'Sleek · Simple · Dark',
    html: `
      <article>
        <h2>Welcome</h2>
        <p>This site supports named embed pages and free-form embeds. Edit embed presets in <code>assets/pages.js</code> — search for "EMBED_PRESET".</p>
        <p class="editable-hint">To add a preset: edit EMBED_PRESETS at the top of <code>assets/pages.js</code>.</p>
      </article>
    `
  };
};

window.TEMPLATES.info = function(params) {
  const title = params.title ? decodeURIComponent(params.title) : 'Information';
  const subtitle = params.subtitle ? decodeURIComponent(params.subtitle) : 'Subheader goes here';
  const content = params.content ? decodeURIComponent(params.content) : 'This is body text. Edit TEMPLATES.info defaults or pass via query params.';
  return {
    title,
    subtitle,
    html: `
      <article>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">${escapeHtml(subtitle)}</p>
        <div>${escapeHtml(content).replace(/\n/g,'<br>')}</div>
        <p class="editable-hint">URL usage: <code>#/info?title=My%20Title&subtitle=Sub&content=Hello</code></p>
      </article>
    `
  };
};

/* Free-form Embed page — unchanged: use #/embed?u=<encoded-url> */
window.TEMPLATES.embed = function(params) {
  const url = params.u ? decodeURIComponent(params.u) : '';
  const sandbox = params.sandbox ? decodeURIComponent(params.sandbox) : 'allow-scripts allow-same-origin';
  const preview = params.preview === '1' ? true : false;
  return {
    title: url ? `Embed: ${url}` : 'Embed URL',
    subtitle: 'Paste a URL to embed. If the site disallows embedding, use "Open in new tab".',
    html: `
      <article>
        <h2>Embed URL (Free-form)</h2>
        <p class="muted">${escapeHtml(url || 'No URL provided')}</p>

        <div class="form-row">
          <input id="embedUrl" type="text" placeholder="https://example.com" value="${escapeHtml(url)}" />
          <button id="embedLoad">Load</button>
        </div>

        <div class="form-row" style="margin-top:8px;">
          <label class="small">Sandbox:</label>
          <select id="embedSandbox">
            <option value="allow-scripts allow-same-origin"${sandbox === 'allow-scripts allow-same-origin' ? ' selected' : ''}>allow-scripts allow-same-origin</option>
            <option value="allow-scripts"${sandbox === 'allow-scripts' ? ' selected' : ''}>allow-scripts</option>
            <option value=""${sandbox === '' ? ' selected' : ''}>none (no sandbox)</option>
          </select>
          <button id="embedPreviewToggle">${preview ? 'Hide Preview' : 'Show Preview'}</button>
          <button id="embedNewTab">Open in new tab</button>
        </div>

        <div id="embedMessage" class="small" style="margin-top:8px;color:var(--muted)">${url ? 'Loaded from hash query.' : 'Enter a URL and press Load.'}</div>

        <div id="embedArea" class="link-preview" style="margin-top:12px;display:${preview ? 'block' : 'none'}">
          <iframe id="embedFrame" src="${escapeHtml(url)}" title="Embed preview" sandbox="${escapeHtml(sandbox)}"></iframe>
        </div>

        <p class="editable-hint">To prefill: use hash query <code>#/embed?u=&sandbox=&preview=1</code> or use the form above.</p>
      </article>
    `
  };
};

/* Embed raw HTML, same as before */
window.TEMPLATES.html = function(params) {
  const contentParam = params.content ? decodeURIComponent(params.content) : '';
  return {
    title: 'Embed HTML',
    subtitle: 'Paste raw HTML or upload a .html file (rendered in an iframe).',
    html: `
      <article>
        <h2>Embed HTML</h2>
        <p class="muted">Paste HTML below or upload a local .html file. Click "Render" to create an isolated preview (Blob URL).</p>

        <div style="margin-top:8px;">
          <textarea id="htmlSource" rows="10" style="width:100%;background:#0b0b0b;border:1px solid rgba(255,255,255,0.04);color:#e6e6e6;padding:8px;border-radius:6px" placeholder="Paste complete HTML here...">${escapeHtml(contentParam)}</textarea>
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

        <p class="editable-hint">For game embeds you may need sandbox state <code>allow-scripts allow-same-origin</code>. Edit defaults in <code>assets/pages.js</code>.</p>
      </article>
    `
  };
};

/* URLs list: includes EMBED_PRESETS automatically */
window.TEMPLATES.urls = function(params) {
  const examples = [
    { label: 'Example.com', url: 'https://example.com' },
    { label: 'Mozilla', url: 'https://www.mozilla.org' },
    { label: 'Wikipedia', url: 'https://en.wikipedia.org' }
  ];

  // Build list HTML for examples + presets
  const exampleHtml = examples.map(e => `<li><a href="#/embed?u=${encodeURIComponent(e.url)}&preview=1">${escapeHtml(e.label)} — ${escapeHtml(e.url)}</a></li>`).join('');
  const presetsHtml = EMBED_PRESETS.map(p => {
    // Link to the preset route, e.g. #/embed/game1
    const route = `#/embed/${encodeURIComponent(p.key)}`;
    return `<li><a href="${route}">${escapeHtml(p.label)} — ${escapeHtml(p.url)} (preset)</a></li>`;
  }).join('');

  return {
    title: 'URLs',
    subtitle: 'Quick examples and presets (editable in assets/pages.js)',
    html: `
      <article>
        <h2>URL Examples</h2>
        <ul>${exampleHtml}${presetsHtml ? '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.03);margin:8px 0">' + presetsHtml : ''}</ul>
        <p class="editable-hint">Edit the <code>EMBED_PRESETS</code> array in <code>assets/pages.js</code> to add/remove presets. Search "EMBED_PRESET" to find them.</p>
      </article>
    `
  };
};

/* ===== Dynamically register a TEMPLATES entry for each EMBED_PRESET =====
   These templates render the preset URL and provide the same controls as the free-form embed page,
   but are prefilled and intended to be changed from code (edit EMBED_PRESETS).
*/
EMBED_PRESETS.forEach(preset => {
  // Key in the router will be 'embed/<key>' so route is #/embed/<key>
  const routeKey = `embed/${preset.key}`;

  // Add a descriptive comment for quick searching
  // (Since comments aren't searchable inside the rendered JS object at runtime via Ctrl+F in the file,
  //  we also included the PAGE: EMBED_PRESET marker above each preset in the array.)
  window.TEMPLATES[routeKey] = function(params) {
    const url = preset.url || '';
    const sandbox = preset.sandbox || 'allow-scripts allow-same-origin';
    const preview = preset.preview ? true : false;
    return {
      title: preset.label || `Embed: ${preset.key}`,
      subtitle: `Preset embed page — edit in assets/pages.js (search "EMBED_PRESET" to find this)`,
      html: `
        <article>
          <h2>${escapeHtml(preset.label || preset.key)}</h2>
          <p class="muted">${escapeHtml(url)}</p>

          <div class="form-row">
            <input id="embedUrl" type="text" placeholder="https://example.com" value="${escapeHtml(url)}" />
            <button id="embedLoad">Load</button>
          </div>

          <div class="form-row" style="margin-top:8px;">
            <label class="small">Sandbox:</label>
            <select id="embedSandbox">
              <option value="allow-scripts allow-same-origin"${sandbox === 'allow-scripts allow-same-origin' ? ' selected' : ''}>allow-scripts allow-same-origin</option>
              <option value="allow-scripts"${sandbox === 'allow-scripts' ? ' selected' : ''}>allow-scripts</option>
              <option value=""${sandbox === '' ? ' selected' : ''}>none (no sandbox)</option>
            </select>
            <button id="embedPreviewToggle">${preview ? 'Hide Preview' : 'Show Preview'}</button>
            <button id="embedNewTab">Open in new tab</button>
          </div>

          <div id="embedMessage" class="small" style="margin-top:8px;color:var(--muted)">This preset is defined in <code>assets/pages.js</code> — search "EMBED_PRESET" to edit.</div>

          <div id="embedArea" class="link-preview" style="margin-top:12px;display:${preview ? 'block' : 'none'}">
            <iframe id="embedFrame" src="${escapeHtml(url)}" title="Embed preview" sandbox="${escapeHtml(sandbox)}"></iframe>
          </div>

          <p class="editable-hint">Preset key: <code>${escapeHtml(preset.key)}</code> — edit the URL in <code>EMBED_PRESETS</code> to change this page.</p>
        </article>
      `
    };
  };

  // Optional: also expose a short alias route 'p/<key>' (e.g. #/p/game1) if you prefer shorter links
  const aliasKey = `p/${preset.key}`;
  if (!window.TEMPLATES[aliasKey]) {
    window.TEMPLATES[aliasKey] = window.TEMPLATES[routeKey];
  }
});

/* End of assets/pages.js */
