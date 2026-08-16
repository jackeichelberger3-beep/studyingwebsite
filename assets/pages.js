/* assets/pages.js
   Purpose:
   - Define page templates and provide a simple render() interface for the router (script.js).
   - This file is intentionally straightforward: each template is a function that receives a params object
     with query parameters (strings) and returns an object { title, subtitle, html }.
   - To add a new template: copy one of the template functions below, give it a different key in TEMPLATES,
     then add a nav link in index.html pointing to "#/yourKey".
   - Keep content editable directly here (strings) for easy changes.
*/

/* Helper: turn plain text into safe HTML by escaping. Simple and sufficient for this use. */
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* TEMPLATES: add or edit entries here */
window.TEMPLATES = {
  // Home page template (default)
  home(params) {
    return {
      title: 'Home',
      subtitle: 'Sleek · Simple · Dark',
      html: `
        <article>
          <h2>Welcome</h2>
          <p>This single-file HTML keeps styles inline and scripts separated. Use the sidebar to open templates. To add pages, edit <code>assets/pages.js</code> and then add a link in the sidebar.</p>
          <p class="editable-hint">Editable in code: change this paragraph in <code>assets/pages.js</code> → <code>TEMPLATES.home</code>.</p>
        </article>
      `
    };
  },

  // Information page template
  // Example usage: #/info?title=My%20Title&subtitle=Short%20line&content=This%20is%20the%20body
  // If no query provided, defaults below are used.
  info(params) {
    const title = params.title ? decodeURIComponent(params.title) : 'Information';
    const subtitle = params.subtitle ? decodeURIComponent(params.subtitle) : 'Subheader goes here';
    const content = params.content ? decodeURIComponent(params.content) : 'This is body text. Edit the defaults in <code>assets/pages.js</code> or pass content via query params.';
    return {
      title,
      subtitle,
      html: `
        <article>
          <h2>${escapeHtml(title)}</h2>
          <p class="muted">${escapeHtml(subtitle)}</p>
          <div>${escapeHtml(content).replace(/\n/g,'<br>')}</div>
          <p class="editable-hint">Editable in code: TEMPLATES.info param defaults and markup.</p>
        </article>
      `
    };
  },

  // URL display page template
  // Example usage: #/url?u=https%3A%2F%2Fexample.com
  // Shows link and an optional iframe preview (if the target allows embedding).
  url(params) {
    const raw = params.u ? decodeURIComponent(params.u) : '';
    const safe = escapeHtml(raw);
    const showPreview = params.preview === '1';
    const iframeHtml = raw ? `<div class="link-preview"><iframe src="${safe}" title="Preview"></iframe></div>` : '';
    return {
      title: raw ? `URL: ${raw}` : 'URL Viewer',
      subtitle: raw ? 'Displays the provided link and preview (if allowed).' : 'Pass a url query parameter like u=https://example.com',
      html: `
        <article>
          <h2>URL Viewer</h2>
          <p class="muted">${escapeHtml(raw || 'No URL provided')}</p>
          <div>
            <div><strong>Link:</strong> ${ raw ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>` : '—' }</div>
            <div class="params-list">Hash query: u=${escapeHtml(params.u || '')} preview=${escapeHtml(params.preview || '')}</div>
            ${ showPreview && raw ? iframeHtml : '' }
          </div>
          <p class="editable-hint">To show the iframe preview, append <code>&preview=1</code> to the hash query.</p>
        </article>
      `
    };
  },

  // Example page that lists several URL templates (demonstrates multiple URL pages)
  urls(params) {
    // Easily editable list of URLs — change this array to add/remove examples.
    const examples = [
      { label: 'Example.com', url: 'https://example.com' },
      { label: 'Mozilla', url: 'https://www.mozilla.org' },
      { label: 'Wikipedia', url: 'https://en.wikipedia.org' }
    ];
    const listHtml = examples.map(e => `<li><a href="#/url?u=${encodeURIComponent(e.url)}">${escapeHtml(e.label)} — ${escapeHtml(e.url)}</a></li>`).join('');
    return {
      title: 'URLs',
      subtitle: 'Quick examples you can click to open in the URL template',
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

/* End of assets/pages.js */
