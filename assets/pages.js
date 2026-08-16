/* ===== DEV_LOG START (SEARCH: DEV_LOG) =====
   Developer changelog (code-edit only).
   - Search with Ctrl+F: "DEV_LOG" or "PAGE: DEV_LOG" to find and edit entries.
   - Each entry: { date, version, title, summary, details: [ ... ] }
   - Route: #/devlog  (alias: #/dl)
   - This page is not a reusable template — it's a code-first changelog.
*/

/* Developer log entries: edit/add entries here */
const DEV_LOG = [
  // PAGE: DEV_LOG: 2026-08-16 — Initial entry
  {
    date: '2026-08-16',
    version: 'v1.0',
    title: 'Initial build',
    summary: 'Base site, sidebar, templates, and basic embed features added.',
    details: [
      'Created core layout (dark minimalist style).',
      'Added TEMPLATES, hash routing, and sidebar toggle.',
      'Implemented free-form URL embed and HTML blob embed.'
    ]
  },

  // PAGE: DEV_LOG: 2026-08-17 — Game library & embed improvements
  {
    date: '2026-08-17',
    version: 'v1.1',
    title: 'Game library and presets',
    summary: 'Added GAME_LIBRARY code-only library and preset embed pages.',
    details: [
      'GAME_LIBRARY created (code-edit-only permanent storage).',
      'Dynamic routes for GAME_LIBRARY: #/game/<key> and #/g/<key>.',
      'Added dev-mode "Allow unsafe" toggle and visible warning.'
    ]
  },

  // Add your new entries below. Copy the object and update date/version/title/summary/details.
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
