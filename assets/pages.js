/* assets/pages.js
   Templates and small UI for embedding external URLs and raw HTML.
   Edit the templates below to change default text or behavior.
*/

/* Escapes text for safe insertion */
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

window.TEMPLATES = {
  home(params) {
    return {
      title: 'Home',
      subtitle: 'Sleek · Simple · Dark',
      html: `
        <article>
          <h2>Welcome</h2>
          <p>This demo allows embedding external sites and raw HTML pages directly inside the app. Use the "Embed URL" or "Embed HTML" pages from the sidebar.</p>
          <p class="editable-hint">Edit this content in <code>assets/pages.js</code> → <code>TEMPLATES.home</code>.</p>
        </article>
      `
    };
  },

  info(params) {
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
  },

  // Embed an external URL into an iframe with sandbox options
  // Use: #/embed or #/embed?u=https%3A%2F%2Fexample.com&sandbox=allow-scripts
  embed(params) {
    const url = params.u ? decodeURIComponent(params.u) : '';
    const sandbox = params.sandbox ? decodeURIComponent(params.sandbox) : 'allow-scripts allow-same-origin';
    const preview = params.preview === '1' ? true : false;
    return {
      title: url ? `Embed: ${url}` : 'Embed URL',
      subtitle: 'Paste a URL to embed. If the site disallows embedding, use "Open in new tab".',
      html: `
        <article>
          <h2>Embed URL</h2>
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
              <option value=""${sandbox === '' ? ' selected' : ''}>none (full restrictions)</option>
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
  },

  // Embed raw HTML: paste or upload a local .html file and render via Blob URL
  // Usage in hash: #/html?content=... (encoded content) — or use the form to paste/upload
  html(params) {
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
  },

  urls(params) {
    const examples = [
      { label: 'Example.com', url: 'https://example.com' },
      { label: 'Mozilla', url: 'https://www.mozilla.org' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org' }
    ];
    const listHtml = examples.map(e => `<li><a href="#/embed?u=${encodeURIComponent(e.url)}&preview=1">${escapeHtml(e.label)} — ${escapeHtml(e.url)}</a></li>`).join('');
    return {
      title: 'URLs',
      subtitle: 'Quick examples you can click to open in the Embed URL template',
      html: `
        <article>
          <h2>URL Examples</h2>
          <ul>${listHtml}</ul>
          <p class="editable-hint">Edit the <code>examples</code> array in <code>assets/pages.js</code> to change these links.</p>
        </article>
      `
    };
  }
};
