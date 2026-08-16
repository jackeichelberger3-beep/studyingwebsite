/* assets/script.js
   Router + interactive handlers for embed pages and game library.
   - Handles rendering, blob creation for HTML entries, and the "allow-unsafe" dev toggle.
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

  // sidebar toggle behavior
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

  // parse hash function
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

  // blob helper
  function createBlobUrl(htmlString) {
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    return {
      url,
      revoke() { URL.revokeObjectURL(url); }
    };
  }

  // Revoke blob references when leaving page
  let _currentBlobRef = null;
  function revokeCurrentBlob(){
    if (_currentBlobRef && typeof _currentBlobRef.revoke === 'function') {
      try { _currentBlobRef.revoke(); } catch(e){}
    }
    _currentBlobRef = null;
  }

  // Initialize interactive behavior for the page after rendering
  function initInteractive(route, params) {
    // Initialize free embed page handlers if present (same as previous implementation)
    // EMBED (free-form)
    const embedUrlInput = document.getElementById('embedUrl');
    const embedLoadBtn = document.getElementById('embedLoad');
    const embedSandboxSelect = document.getElementById('embedSandbox');
    const embedPreviewToggle = document.getElementById('embedPreviewToggle');
    const embedArea = document.getElementById('embedArea');
    const embedFrame = document.getElementById('embedFrame');
    const embedMessage = document.getElementById('embedMessage');
    const embedNewTab = document.getElementById('embedNewTab');

    if (embedLoadBtn) {
      embedLoadBtn.addEventListener('click', () => {
        const u = embedUrlInput.value.trim();
        if (!u) { embedMessage.textContent = 'Please enter a URL.'; return; }
        try {
          embedFrame.src = u;
          embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
          embedArea.style.display = 'block';
          embedMessage.textContent = 'Loaded — if the site prevents embedding, use "Open in new tab".';
        } catch (err) { embedMessage.textContent = 'Error loading URL.'; }
      });
      embedSandboxSelect.addEventListener('change', ()=> {
        if (embedFrame) embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
      });
      embedPreviewToggle.addEventListener('click', ()=> {
        if (!embedArea) return;
        const showing = embedArea.style.display !== 'none';
        embedArea.style.display = showing ? 'none' : 'block';
        embedPreviewToggle.textContent = showing ? 'Show Preview' : 'Hide Preview';
      });
      embedNewTab.addEventListener('click', ()=> {
        const u = embedUrlInput.value.trim();
        if (u) window.open(u, '_blank', 'noopener');
      });
      if (params.u && embedFrame) {
        embedFrame.src = params.u;
        embedFrame.setAttribute('sandbox', params.sandbox || embedSandboxSelect.value || '');
        if (params.preview === '1') embedArea.style.display = 'block';
      }
    }

    // EMBED HTML handlers
    const htmlSource = document.getElementById('htmlSource');
    const htmlFile = document.getElementById('htmlFile');
    const htmlRender = document.getElementById('htmlRender');
    const htmlOpen = document.getElementById('htmlOpen');
    const htmlSandbox = document.getElementById('htmlSandbox');
    const htmlMsg = document.getElementById('htmlMsg');
    const htmlPreview = document.getElementById('htmlPreview');
    const htmlFrame = document.getElementById('htmlFrame');

    let currentBlob = null;
    function setPreviewFromString(htmlString) {
      if (currentBlob) currentBlob.revoke();
      const created = createBlobUrl(htmlString);
      currentBlob = created;
      htmlFrame.src = created.url;
      htmlFrame.setAttribute('sandbox', htmlSandbox ? htmlSandbox.value || '' : '');
      htmlPreview.style.display = 'block';
      htmlMsg.textContent = 'Rendered below. Click "Open in new tab" to open the blob URL directly.';
      // store global ref so it's revoked on navigation
      _currentBlobRef = {
        revoke: () => { created.revoke(); currentBlob = null; }
      };
    }

    if (htmlRender) {
      htmlRender.addEventListener('click', ()=> {
        const text = htmlSource.value;
        if (!text) { htmlMsg.textContent = 'Paste HTML or upload a file first.'; return; }
        setPreviewFromString(text);
      });
    }
    if (htmlFile) {
      htmlFile.addEventListener('change', (ev)=> {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e)=> {
          const txt = e.target.result;
          if (htmlSource) htmlSource.value = txt;
          setPreviewFromString(txt);
        };
        reader.onerror = ()=> { htmlMsg.textContent = 'Error reading file.'; };
        reader.readAsText(f);
      });
    }
    if (htmlOpen) {
      htmlOpen.addEventListener('click', ()=> {
        if (_currentBlobRef && _currentBlobRef.url) {
          window.open(_currentBlobRef.url, '_blank', 'noopener');
        } else if (htmlSource && htmlSource.value) {
          const created = createBlobUrl(htmlSource.value);
          window.open(created.url, '_blank', 'noopener');
          setTimeout(()=> created.revoke(), 2000);
        } else {
          htmlMsg.textContent = 'Render first before opening in new tab.';
        }
      });
    }
    if (htmlSandbox) {
      htmlSandbox.addEventListener('change', ()=> {
        if (htmlFrame) htmlFrame.setAttribute('sandbox', htmlSandbox.value || '');
      });
    }

    // GAME LIBRARY pages: look for game-specific controls (IDs like gameIframe etc.)
    const gameLoadBtn = document.getElementById('gameLoadBtn');
    const gameNewTabBtn = document.getElementById('gameNewTabBtn');
    const gameIframe = document.getElementById('gameIframe');
    const gameAllowUnsafe = document.getElementById('gameAllowUnsafe');
    const gameWarning = document.getElementById('gameWarning');
    const gameArea = document.getElementById('gameArea');

    // If this is a library route, route looks like "game/<key>" or "g/<key>"
    const parsed = parseHash(location.hash);
    if (parsed.route && (parsed.route.startsWith('game/') || parsed.route.startsWith('g/'))) {
      // extract key
      const parts = parsed.route.split('/');
      const key = parts[1];
      // find entry in GAME_LIBRARY (defined in assets/pages.js)
      const entry = (window.GAME_LIBRARY && window.GAME_LIBRARY.find(e => e.key === key));
      if (entry) {
        // If entry is html type, create a blob now if preview requested
        let currentGameBlob = null;
        function revokeGameBlob(){
          if (currentGameBlob && typeof currentGameBlob.revoke === 'function') {
            try { currentGameBlob.revoke(); } catch(e){}
          }
          currentGameBlob = null;
        }
        // load function: set iframe.src according to type and sandbox choice
        function loadGame() {
          // revoke previous
          revokeGameBlob();
          if (!gameIframe) return;
          // determine sandbox value: if allowUnsafe checked -> remove sandbox attr
          const allowUnsafe = gameAllowUnsafe && gameAllowUnsafe.checked;
          if (allowUnsafe) {
            // show warning and remove sandbox
            if (gameWarning) gameWarning.style.display = 'block';
            try { gameIframe.removeAttribute('sandbox'); } catch(e){}
            // add permissive allow attributes for advanced use
            gameIframe.setAttribute('allow', 'autoplay; fullscreen; microphone; camera; encrypted-media; clipboard-read; clipboard-write');
          } else {
            if (gameWarning) gameWarning.style.display = 'none';
            // set default sandbox from entry or fallback
            const sb = entry.sandbox || 'allow-scripts allow-same-origin';
            gameIframe.setAttribute('sandbox', sb);
            gameIframe.removeAttribute('allow');
          }

          if (entry.type === 'url') {
            // For URL entries we DO NOT show the raw URL in the UI. Use it as iframe src and open-in-tab target.
            gameIframe.src = entry.url;
            if (gameArea) gameArea.style.display = 'block';
          } else if (entry.type === 'html') {
            // create blob from entry.html
            const created = createBlobUrl(entry.html || '<!doctype html><html><body></body></html>');
            currentGameBlob = created;
            gameIframe.src = created.url;
            if (gameArea) gameArea.style.display = 'block';
            // store reference to revoke on route change
            _currentBlobRef = {
              url: created.url,
              revoke: () => { created.revoke(); currentGameBlob = null; }
            };
          }
        }

        // Open in new tab button behavior
        if (gameNewTabBtn) {
          gameNewTabBtn.addEventListener('click', ()=> {
            if (entry.type === 'url') {
              window.open(entry.url, '_blank', 'noopener');
            } else if (entry.type === 'html') {
              // if current blob exists, open it; else create a temporary blob
              if (_currentBlobRef && _currentBlobRef.url) {
                window.open(_currentBlobRef.url, '_blank', 'noopener');
              } else {
                const c = createBlobUrl(entry.html || '<!doctype html><html><body></body></html>');
                window.open(c.url, '_blank', 'noopener');
                setTimeout(()=> c.revoke(), 2000);
              }
            }
          });
        }

        // Load button
        if (gameLoadBtn) {
          gameLoadBtn.addEventListener('click', ()=> {
            loadGame();
          });
        }

        // Allow-unsafe toggle: show warning when toggled
        if (gameAllowUnsafe) {
          gameAllowUnsafe.addEventListener('change', ()=> {
            // re-load to apply new sandbox/remove attribute
            loadGame();
          });
        }

        // Auto-load if entry.preview is true
        if (entry.preview) {
          // small delay to ensure iframe exists
          setTimeout(()=> loadGame(), 10);
        }

        // Revoke the per-page blob when navigating away
        // store function to revoke on renderFromHash
        window._pageRevoke = revokeGameBlob;
      }
    }
  }

  // Render function
  function renderFromHash() {
    const { route, params } = parseHash(location.hash);
    const templateFn = window.TEMPLATES && window.TEMPLATES[route] ? window.TEMPLATES[route] : window.TEMPLATES.home;
    const page = templateFn(params || {});
    mainTitle.textContent = page.title || 'Untitled';
    mainSubtitle.textContent = page.subtitle || '';

    // Revoke any previous blob used by other pages
    revokeCurrentBlob();
    if (window._pageRevoke && typeof window._pageRevoke === 'function') {
      try { window._pageRevoke(); } catch(e) {}
      window._pageRevoke = null;
    }

    content.innerHTML = page.html || '';

    // Mark active nav link
    document.querySelectorAll('.nav-link').forEach(a => {
      const aRoute = a.getAttribute('data-route') || a.getAttribute('href')?.split('?')[0]?.replace('#/','');
      if (aRoute && aRoute === route) a.classList.add('active'); else a.classList.remove('active');
    });

    // Initialize interactive elements after DOM inserted
    setTimeout(()=> initInteractive(route, params), 0);
  }

  window.addEventListener('hashchange', renderFromHash);
  document.addEventListener('DOMContentLoaded', ()=> {
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

})();    overlay.classList.remove('show');
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

  // parse hash function
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

  // blob helper
  function createBlobUrl(htmlString) {
    const blob = new Blob([htmlString], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    return {
      url,
      revoke() { URL.revokeObjectURL(url); }
    };
  }

  // Revoke blob references when leaving page
  let _currentBlobRef = null;
  function revokeCurrentBlob(){
    if (_currentBlobRef && typeof _currentBlobRef.revoke === 'function') {
      try { _currentBlobRef.revoke(); } catch(e){}
    }
    _currentBlobRef = null;
  }

  // Initialize interactive behavior for the page after rendering
  function initInteractive(route, params) {
    // Initialize free embed page handlers if present (same as previous implementation)
    // EMBED (free-form)
    const embedUrlInput = document.getElementById('embedUrl');
    const embedLoadBtn = document.getElementById('embedLoad');
    const embedSandboxSelect = document.getElementById('embedSandbox');
    const embedPreviewToggle = document.getElementById('embedPreviewToggle');
    const embedArea = document.getElementById('embedArea');
    const embedFrame = document.getElementById('embedFrame');
    const embedMessage = document.getElementById('embedMessage');
    const embedNewTab = document.getElementById('embedNewTab');

    if (embedLoadBtn) {
      embedLoadBtn.addEventListener('click', () => {
        const u = embedUrlInput.value.trim();
        if (!u) { embedMessage.textContent = 'Please enter a URL.'; return; }
        try {
          embedFrame.src = u;
          embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
          embedArea.style.display = 'block';
          embedMessage.textContent = 'Loaded — if the site prevents embedding, use "Open in new tab".';
        } catch (err) { embedMessage.textContent = 'Error loading URL.'; }
      });
      embedSandboxSelect.addEventListener('change', ()=> {
        if (embedFrame) embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
      });
      embedPreviewToggle.addEventListener('click', ()=> {
        if (!embedArea) return;
        const showing = embedArea.style.display !== 'none';
        embedArea.style.display = showing ? 'none' : 'block';
        embedPreviewToggle.textContent = showing ? 'Show Preview' : 'Hide Preview';
      });
      embedNewTab.addEventListener('click', ()=> {
        const u = embedUrlInput.value.trim();
        if (u) window.open(u, '_blank', 'noopener');
      });
      if (params.u && embedFrame) {
        embedFrame.src = params.u;
        embedFrame.setAttribute('sandbox', params.sandbox || embedSandboxSelect.value || '');
        if (params.preview === '1') embedArea.style.display = 'block';
      }
    }

    // EMBED HTML handlers
    const htmlSource = document.getElementById('htmlSource');
    const htmlFile = document.getElementById('htmlFile');
    const htmlRender = document.getElementById('htmlRender');
    const htmlOpen = document.getElementById('htmlOpen');
    const htmlSandbox = document.getElementById('htmlSandbox');
    const htmlMsg = document.getElementById('htmlMsg');
    const htmlPreview = document.getElementById('htmlPreview');
    const htmlFrame = document.getElementById('htmlFrame');

    let currentBlob = null;
    function setPreviewFromString(htmlString) {
      if (currentBlob) currentBlob.revoke();
      const created = createBlobUrl(htmlString);
      currentBlob = created;
      htmlFrame.src = created.url;
      htmlFrame.setAttribute('sandbox', htmlSandbox ? htmlSandbox.value || '' : '');
      htmlPreview.style.display = 'block';
      htmlMsg.textContent = 'Rendered below. Click "Open in new tab" to open the blob URL directly.';
      // store global ref so it's revoked on navigation
      _currentBlobRef = {
        revoke: () => { created.revoke(); currentBlob = null; }
      };
    }

    if (htmlRender) {
      htmlRender.addEventListener('click', ()=> {
        const text = htmlSource.value;
        if (!text) { htmlMsg.textContent = 'Paste HTML or upload a file first.'; return; }
        setPreviewFromString(text);
      });
    }
    if (htmlFile) {
      htmlFile.addEventListener('change', (ev)=> {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e)=> {
          const txt = e.target.result;
          if (htmlSource) htmlSource.value = txt;
          setPreviewFromString(txt);
        };
        reader.onerror = ()=> { htmlMsg.textContent = 'Error reading file.'; };
        reader.readAsText(f);
      });
    }
    if (htmlOpen) {
      htmlOpen.addEventListener('click', ()=> {
        if (_currentBlobRef && _currentBlobRef.url) {
          window.open(_currentBlobRef.url, '_blank', 'noopener');
        } else if (htmlSource && htmlSource.value) {
          const created = createBlobUrl(htmlSource.value);
          window.open(created.url, '_blank', 'noopener');
          setTimeout(()=> created.revoke(), 2000);
        } else {
          htmlMsg.textContent = 'Render first before opening in new tab.';
        }
      });
    }
    if (htmlSandbox) {
      htmlSandbox.addEventListener('change', ()=> {
        if (htmlFrame) htmlFrame.setAttribute('sandbox', htmlSandbox.value || '');
      });
    }

    // GAME LIBRARY pages: look for game-specific controls (IDs like gameIframe etc.)
    const gameLoadBtn = document.getElementById('gameLoadBtn');
    const gameNewTabBtn = document.getElementById('gameNewTabBtn');
    const gameIframe = document.getElementById('gameIframe');
    const gameAllowUnsafe = document.getElementById('gameAllowUnsafe');
    const gameWarning = document.getElementById('gameWarning');
    const gameArea = document.getElementById('gameArea');

    // If this is a library route, route looks like "game/<key>" or "g/<key>"
    const parsed = parseHash(location.hash);
    if (parsed.route && (parsed.route.startsWith('game/') || parsed.route.startsWith('g/'))) {
      // extract key
      const parts = parsed.route.split('/');
      const key = parts[1];
      // find entry in GAME_LIBRARY (defined in assets/pages.js)
      const entry = (window.GAME_LIBRARY && window.GAME_LIBRARY.find(e => e.key === key));
      if (entry) {
        // If entry is html type, create a blob now if preview requested
        let currentGameBlob = null;
        function revokeGameBlob(){
          if (currentGameBlob && typeof currentGameBlob.revoke === 'function') {
            try { currentGameBlob.revoke(); } catch(e){}
          }
          currentGameBlob = null;
        }
        // load function: set iframe.src according to type and sandbox choice
        function loadGame() {
          // revoke previous
          revokeGameBlob();
          if (!gameIframe) return;
          // determine sandbox value: if allowUnsafe checked -> remove sandbox attr
          const allowUnsafe = gameAllowUnsafe && gameAllowUnsafe.checked;
          if (allowUnsafe) {
            // show warning and remove sandbox
            if (gameWarning) gameWarning.style.display = 'block';
            try { gameIframe.removeAttribute('sandbox'); } catch(e){}
            // add permissive allow attributes for advanced use
            gameIframe.setAttribute('allow', 'autoplay; fullscreen; microphone; camera; encrypted-media; clipboard-read; clipboard-write');
          } else {
            if (gameWarning) gameWarning.style.display = 'none';
            // set default sandbox from entry or fallback
            const sb = entry.sandbox || 'allow-scripts allow-same-origin';
            gameIframe.setAttribute('sandbox', sb);
            gameIframe.removeAttribute('allow');
          }

          if (entry.type === 'url') {
            // For URL entries we DO NOT show the raw URL in the UI. Use it as iframe src and open-in-tab target.
            gameIframe.src = entry.url;
            if (gameArea) gameArea.style.display = 'block';
          } else if (entry.type === 'html') {
            // create blob from entry.html
            const created = createBlobUrl(entry.html || '<!doctype html><html><body></body></html>');
            currentGameBlob = created;
            gameIframe.src = created.url;
            if (gameArea) gameArea.style.display = 'block';
            // store reference to revoke on route change
            _currentBlobRef = {
              url: created.url,
              revoke: () => { created.revoke(); currentGameBlob = null; }
            };
          }
        }

        // Open in new tab button behavior
        if (gameNewTabBtn) {
          gameNewTabBtn.addEventListener('click', ()=> {
            if (entry.type === 'url') {
              window.open(entry.url, '_blank', 'noopener');
            } else if (entry.type === 'html') {
              // if current blob exists, open it; else create a temporary blob
              if (_currentBlobRef && _currentBlobRef.url) {
                window.open(_currentBlobRef.url, '_blank', 'noopener');
              } else {
                const c = createBlobUrl(entry.html || '<!doctype html><html><body></body></html>');
                window.open(c.url, '_blank', 'noopener');
                setTimeout(()=> c.revoke(), 2000);
              }
            }
          });
        }

        // Load button
        if (gameLoadBtn) {
          gameLoadBtn.addEventListener('click', ()=> {
            loadGame();
          });
        }

        // Allow-unsafe toggle: show warning when toggled
        if (gameAllowUnsafe) {
          gameAllowUnsafe.addEventListener('change', ()=> {
            // re-load to apply new sandbox/remove attribute
            loadGame();
          });
        }

        // Auto-load if entry.preview is true
        if (entry.preview) {
          // small delay to ensure iframe exists
          setTimeout(()=> loadGame(), 10);
        }

        // Revoke the per-page blob when navigating away
        // store function to revoke on renderFromHash
        window._pageRevoke = revokeGameBlob;
      }
    }
  }

  // Render function
  function renderFromHash() {
    const { route, params } = parseHash(location.hash);
    const templateFn = window.TEMPLATES && window.TEMPLATES[route] ? window.TEMPLATES[route] : window.TEMPLATES.home;
    const page = templateFn(params || {});
    mainTitle.textContent = page.title || 'Untitled';
    mainSubtitle.textContent = page.subtitle || '';

    // Revoke any previous blob used by other pages
    revokeCurrentBlob();
    if (window._pageRevoke && typeof window._pageRevoke === 'function') {
      try { window._pageRevoke(); } catch(e) {}
      window._pageRevoke = null;
    }

    content.innerHTML = page.html || '';

    // Mark active nav link
    document.querySelectorAll('.nav-link').forEach(a => {
      const aRoute = a.getAttribute('data-route') || a.getAttribute('href')?.split('?')[0]?.replace('#/','');
      if (aRoute && aRoute === route) a.classList.add('active'); else a.classList.remove('active');
    });

    // Initialize interactive elements after DOM inserted
    setTimeout(()=> initInteractive(route, params), 0);
  }

  window.addEventListener('hashchange', renderFromHash);
  document.addEventListener('DOMContentLoaded', ()=> {
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

})();
