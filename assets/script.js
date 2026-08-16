/* assets/script.js
   Router and UI glue. Adds handlers for embed forms and HTML rendering.
*/

(() => {
  const app = document.querySelector('.app');
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('overlay');
  const mainTitle = document.getElementById('pageTitle');
  const mainSubtitle = document.getElementById('pageSubtitle');
  const content = document.getElementById('appContent');

  // remember collapsed state
  const saved = localStorage.getItem('sidebarCollapsed') === 'true';
  if (saved) app.classList.add('collapsed');

  toggle.addEventListener('click', () => {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (isMobile) {
      sidebar.classList.add('open');
      overlay.hidden = false;
      overlay.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      app.classList.toggle('collapsed');
      const collapsed = app.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    setTimeout(()=> overlay.hidden = true, 250);
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) overlay.click();
  });

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width:900px)').matches) overlay.click();
    });
  });

  let lastMobile = window.matchMedia('(max-width:900px)').matches;
  window.addEventListener('resize', () => {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (lastMobile && !isMobile) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      overlay.hidden = true;
    }
    lastMobile = isMobile;
  });

  function parseHash(hash) {
    if (!hash || hash === '#') return { route: 'home', params: {} };
    const clean = hash.startsWith('#') ? hash.substring(1) : hash;
    const [pathPart, queryPart] = clean.split('?');
    const route = (pathPart.startsWith('/') ? pathPart.substring(1) : pathPart) || 'home';
    const params = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [k,v=''] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { route, params };
  }

  // helper: create blob url from string, returns { url, revokeFn }
  function createBlobUrl(htmlString) {
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    return {
      url,
      revoke() { URL.revokeObjectURL(url); }
    };
  }

  // Initialize interactive bits inside rendered page
  function initInteractive(route, params) {
    // EMBED URL page handlers
    const embedUrlInput = document.getElementById('embedUrl');
    const embedLoadBtn = document.getElementById('embedLoad');
    const embedSandboxSelect = document.getElementById('embedSandbox');
    const embedPreviewToggle = document.getElementById('embedPreviewToggle');
    const embedArea = document.getElementById('embedArea');
    const embedFrame = document.getElementById('embedFrame');
    const embedMessage = document.getElementById('embedMessage');
    const embedNewTab = document.getElementById('embedNewTab');

    if (embedLoadBtn) {
      // prefill from params if provided (done via template), keep logic here for re-loading
      embedLoadBtn.addEventListener('click', () => {
        const u = embedUrlInput.value.trim();
        if (!u) {
          embedMessage.textContent = 'Please enter a URL.';
          return;
        }
        // set iframe src and sandbox
        try {
          embedFrame.src = u;
          embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
          embedArea.style.display = 'block';
          embedMessage.textContent = 'Loaded — if the site prevents embedding, use "Open in new tab".';
        } catch (err) {
          embedMessage.textContent = 'Error loading URL.';
        }
      });

      embedSandboxSelect.addEventListener('change', () => {
        if (embedFrame) embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
      });

      embedPreviewToggle.addEventListener('click', () => {
        if (!embedArea) return;
        const showing = embedArea.style.display !== 'none';
        embedArea.style.display = showing ? 'none' : 'block';
        embedPreviewToggle.textContent = showing ? 'Show Preview' : 'Hide Preview';
      });

      embedNewTab.addEventListener('click', () => {
        const u = embedUrlInput.value.trim();
        if (u) window.open(u, '_blank', 'noopener');
      });

      // If params.u was provided, auto-load into iframe if present
      if (params.u && embedFrame) {
        embedFrame.src = params.u;
        embedFrame.setAttribute('sandbox', params.sandbox || embedSandboxSelect.value || '');
        if (params.preview === '1') embedArea.style.display = 'block';
      }
    }

    // EMBED HTML page handlers
    const htmlSource = document.getElementById('htmlSource');
    const htmlFile = document.getElementById('htmlFile');
    const htmlRender = document.getElementById('htmlRender');
    const htmlOpen = document.getElementById('htmlOpen');
    const htmlSandbox = document.getElementById('htmlSandbox');
    const htmlMsg = document.getElementById('htmlMsg');
    const htmlPreview = document.getElementById('htmlPreview');
    const htmlFrame = document.getElementById('htmlFrame');

    // store current blob to revoke when replaced
    let currentBlob = null;

    function setPreviewFromString(htmlString) {
      if (currentBlob) currentBlob.revoke();
      const created = createBlobUrl(htmlString);
      currentBlob = created;
      htmlFrame.src = created.url;
      htmlFrame.setAttribute('sandbox', htmlSandbox ? htmlSandbox.value || '' : '');
      htmlPreview.style.display = 'block';
      htmlMsg.textContent = 'Rendered below. Click "Open in new tab" to open the blob URL directly.';
    }

    if (htmlRender) {
      htmlRender.addEventListener('click', () => {
        const text = htmlSource.value;
        if (!text) {
          htmlMsg.textContent = 'Paste HTML or upload a file first.';
          return;
        }
        setPreviewFromString(text);
      });
    }

    if (htmlFile) {
      htmlFile.addEventListener('change', (ev) => {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const txt = e.target.result;
          // populate textarea for easy editing
          if (htmlSource) htmlSource.value = txt;
          setPreviewFromString(txt);
        };
        reader.onerror = () => {
          htmlMsg.textContent = 'Error reading file.';
        };
        reader.readAsText(f);
      });
    }

    if (htmlOpen) {
      htmlOpen.addEventListener('click', () => {
        if (currentBlob && currentBlob.url) {
          window.open(currentBlob.url, '_blank', 'noopener');
        } else if (htmlSource && htmlSource.value) {
          // create temp blob and open
          const created = createBlobUrl(htmlSource.value);
          // open then revoke after short delay (can't revoke until opened)
          window.open(created.url, '_blank', 'noopener');
          setTimeout(() => created.revoke(), 2000);
        } else {
          htmlMsg.textContent = 'Render first before opening in new tab.';
        }
      });
    }

    if (htmlSandbox) {
      htmlSandbox.addEventListener('change', () => {
        if (htmlFrame) htmlFrame.setAttribute('sandbox', htmlSandbox.value || '');
      });
    }

    // Cleanup when navigating away: revoke blob url
    // We'll attach to window so renderFromHash can revoke when re-rendering
    window._currentBlobRef = {
      revoke() {
        if (currentBlob) { currentBlob.revoke(); currentBlob = null; }
      }
    };
  }

  function renderFromHash() {
    const { route, params } = parseHash(location.hash);
    const templateFn = window.TEMPLATES && window.TEMPLATES[route] ? window.TEMPLATES[route] : window.TEMPLATES.home;
    const page = templateFn(params || {});
    mainTitle.textContent = page.title || 'Untitled';
    mainSubtitle.textContent = page.subtitle || '';
    // Revoke any previous blob used by html preview
    if (window._currentBlobRef && typeof window._currentBlobRef.revoke === 'function') {
      window._currentBlobRef.revoke();
      window._currentBlobRef = null;
    }
    content.innerHTML = page.html || '';
    // set active nav link
    document.querySelectorAll('.nav-link').forEach(a => {
      const aRoute = a.getAttribute('data-route') || a.getAttribute('href')?.split('?')[0]?.replace('#/','');
      if (aRoute && aRoute === route) a.classList.add('active'); else a.classList.remove('active');
    });
    // initialize interactive handlers after insertion
    setTimeout(() => initInteractive(route, params), 0);
  }

  window.addEventListener('hashchange', renderFromHash);
  document.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '#/home';
    renderFromHash();
  });

  // Reset button
  document.querySelectorAll('#themeReset').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('sidebarCollapsed');
      app.classList.remove('collapsed');
    });
  });

  // helper parse
  function parseHash(hash) {
    if (!hash || hash === '#') return { route: 'home', params: {} };
    const clean = hash.startsWith('#') ? hash.substring(1) : hash;
    const [pathPart, queryPart] = clean.split('?');
    const route = (pathPart.startsWith('/') ? pathPart.substring(1) : pathPart) || 'home';
    const params = {};
    if (queryPart) {
      queryPart.split('&').forEach(pair => {
        const [k,v=''] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { route, params };
  }

})();
