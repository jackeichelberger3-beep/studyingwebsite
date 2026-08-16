/* assets/script.js
   Simple, robust router + page initializers.
*/

(function(){
  const app = document.querySelector('.app');
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('overlay');
  const mainTitle = document.getElementById('pageTitle');
  const mainSubtitle = document.getElementById('pageSubtitle');
  const content = document.getElementById('appContent');

  // restore collapsed state
  try {
    if (localStorage.getItem('sidebarCollapsed') === 'true') app.classList.add('collapsed');
  } catch(e){}

  // sidebar toggle behavior
  toggle.addEventListener('click', () => {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (isMobile) {
      sidebar.classList.add('open');
      overlay.hidden = false;
      overlay.classList.add('show');
      toggle.setAttribute('aria-expanded','true');
    } else {
      app.classList.toggle('collapsed');
      const collapsed = app.classList.contains('collapsed');
      try { localStorage.setItem('sidebarCollapsed', collapsed); } catch(e){}
      toggle.setAttribute('aria-expanded', String(!collapsed));
    }
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    setTimeout(()=> overlay.hidden = true, 250);
    toggle.setAttribute('aria-expanded','false');
  });

  document.addEventListener('keydown', (e)=>{
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

  // parse hash: returns {route, params}
  function parseHash(h) {
    if (!h || h === '#') return { route: 'home', params: {} };
    const raw = h.startsWith('#') ? h.substring(1) : h;
    const [path, q] = raw.split('?');
    const route = (path.startsWith('/') ? path.substring(1) : path) || 'home';
    const params = {};
    if (q) q.split('&').forEach(pair => {
      const [k,v=''] = pair.split('=');
      try { params[decodeURIComponent(k)] = decodeURIComponent(v||''); } catch(e){ params[k]=v; }
    });
    return { route, params };
  }

  // blob management
  let currentBlob = null;
  function createBlob(html){
    if (currentBlob) {
      try { URL.revokeObjectURL(currentBlob.url); } catch(e){}
      currentBlob = null;
    }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    currentBlob = { url, revoke() { try { URL.revokeObjectURL(url); } catch(e){} } };
    return currentBlob;
  }
  function revokeBlob(){
    if (currentBlob && currentBlob.revoke) { currentBlob.revoke(); currentBlob = null; }
  }

  // mark active nav link (top-level matching)
  function setActiveNav(route) {
    const top = route.split('/')[0];
    document.querySelectorAll('.nav-link').forEach(a => {
      const dr = a.getAttribute('data-route') || a.getAttribute('href')?.split('?')[0]?.replace('#/','');
      a.classList.toggle('active', dr === top);
    });
  }

  // render page from route key
  function renderRoute(route, params) {
    // prefer exact match in TEMPLATES
    const fn = (window.TEMPLATES && window.TEMPLATES[route]) ? window.TEMPLATES[route]
             : (window.TEMPLATES && window.TEMPLATES[route.replace(/^\/|\/$/g,'')]) ? window.TEMPLATES[route.replace(/^\/|\/$/g,'')]
             : (window.TEMPLATES && window.TEMPLATES.home) ? window.TEMPLATES.home
             : null;

    if (!fn) {
      mainTitle.textContent = 'Not found';
      mainSubtitle.textContent = '';
      content.innerHTML = `<article><h2>404</h2><p class="muted">No template for route: ${escapeHtml(route)}</p></article>`;
      return;
    }

    const page = fn(params || {});
    mainTitle.textContent = page.title || '';
    mainSubtitle.textContent = page.subtitle || '';
    // revoke any previous blob
    revokeBlob();
    // insert html (safe innerHTML because admin is editing code)
    content.innerHTML = page.html || '';
    setActiveNav(route);
    // initialize interactive elements for this page
    setTimeout(()=> initInteractive(route, params), 0);
  }

  // initializer for interactive controls; safe guards when elements don't exist
  function initInteractive(route, params) {
    // Free-form embed handlers
    const embedUrlInput = document.getElementById('embedUrl');
    const embedLoadBtn = document.getElementById('embedLoad');
    const embedSandboxSelect = document.getElementById('embedSandbox');
    const embedPreviewToggle = document.getElementById('embedPreviewToggle');
    const embedArea = document.getElementById('embedArea');
    const embedFrame = document.getElementById('embedFrame');
    const embedMessage = document.getElementById('embedMessage');
    const embedNewTab = document.getElementById('embedNewTab');

    if (embedLoadBtn && embedUrlInput) {
      embedLoadBtn.addEventListener('click', ()=> {
        const u = embedUrlInput.value.trim();
        if (!u) { if (embedMessage) embedMessage.textContent = 'Enter a URL.'; return; }
        if (embedFrame) embedFrame.src = u;
        if (embedSandboxSelect && embedFrame) embedFrame.setAttribute('sandbox', embedSandboxSelect.value || '');
        if (embedArea) embedArea.style.display = 'block';
        if (embedMessage) embedMessage.textContent = 'Loaded — if blocked, use Open in new tab.';
      });
    }
    if (embedSandboxSelect && embedFrame) {
      embedSandboxSelect.addEventListener('change', ()=> embedFrame.setAttribute('sandbox', embedSandboxSelect.value || ''));
    }
    if (embedPreviewToggle && embedArea) {
      embedPreviewToggle.addEventListener('click', ()=> {
        const showing = embedArea.style.display !== 'none';
        embedArea.style.display = showing ? 'none' : 'block';
        embedPreviewToggle.textContent = showing ? 'Show Preview' : 'Hide Preview';
      });
    }
    if (embedNewTab && embedUrlInput) {
      embedNewTab.addEventListener('click', ()=> {
        const u = embedUrlInput.value.trim();
        if (u) window.open(u, '_blank', 'noopener');
      });
    }

    // Embed HTML handlers (blob creation)
    const htmlSource = document.getElementById('htmlSource');
    const htmlFile = document.getElementById('htmlFile');
    const htmlRender = document.getElementById('htmlRender');
    const htmlOpen = document.getElementById('htmlOpen');
    const htmlSandbox = document.getElementById('htmlSandbox');
    const htmlMsg = document.getElementById('htmlMsg');
    const htmlPreview = document.getElementById('htmlPreview');
    const htmlFrame = document.getElementById('htmlFrame');

    if (htmlRender && htmlSource) {
      htmlRender.addEventListener('click', ()=> {
        const text = htmlSource.value;
        if (!text) { if (htmlMsg) htmlMsg.textContent = 'Paste HTML first.'; return; }
        const b = createBlob(text);
        if (htmlFrame) htmlFrame.src = b.url;
        if (htmlFrame && htmlSandbox) htmlFrame.setAttribute('sandbox', htmlSandbox.value || '');
        if (htmlPreview) htmlPreview.style.display = 'block';
        if (htmlMsg) htmlMsg.textContent = 'Rendered below.';
      });
    }
    if (htmlFile && htmlSource) {
      htmlFile.addEventListener('change', (ev) => {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (e) => { htmlSource.value = e.target.result || ''; };
        reader.readAsText(f);
      });
    }
    if (htmlOpen) {
      htmlOpen.addEventListener('click', ()=> {
        if (currentBlob && currentBlob.url) {
          window.open(currentBlob.url, '_blank', 'noopener');
        } else if (htmlSource && htmlSource.value) {
          const tmp = createBlob(htmlSource.value);
          window.open(tmp.url, '_blank', 'noopener');
          setTimeout(()=> { try { tmp.revoke(); } catch(e){} }, 2000);
        }
      });
    }
    if (htmlSandbox && htmlFrame) {
      htmlSandbox.addEventListener('change', ()=> htmlFrame.setAttribute('sandbox', htmlSandbox.value || ''));
    }

    // Preset embed and game pages: detect game iframe controls
    const gameLoadBtn = document.getElementById('gameLoadBtn');
    const gameNewTabBtn = document.getElementById('gameNewTabBtn');
    const gameIframe = document.getElementById('gameIframe');
    const gameAllowUnsafe = document.getElementById('gameAllowUnsafe');
    const gameWarning = document.getElementById('gameWarning');
    const gameArea = document.getElementById('gameArea');

    // If route is game/<key> or g/<key>, load appropriate entry
    if ((route.startsWith('game/') || route.startsWith('g/')) && gameIframe) {
      const key = route.split('/')[1];
      const entry = (window.GAME_LIBRARY || []).find(e => e.key === key);
      if (!entry) return;
      // helper to load the entry into iframe
      let localBlob = null;
      function loadEntry(){
        // revoke previous local blob
        if (localBlob && localBlob.revoke) { try{ localBlob.revoke(); }catch(e){} localBlob = null; }
        const allowUnsafe = gameAllowUnsafe && gameAllowUnsafe.checked;
        if (allowUnsafe) {
          gameWarning && (gameWarning.style.display = 'block');
          try { gameIframe.removeAttribute('sandbox'); } catch(e){}
          gameIframe.setAttribute('allow', 'autoplay; fullscreen; microphone; camera; encrypted-media; clipboard-read; clipboard-write');
        } else {
          gameWarning && (gameWarning.style.display = 'none');
          gameIframe.setAttribute('sandbox', entry.sandbox || 'allow-scripts allow-same-origin');
          gameIframe.removeAttribute('allow');
        }

        if (entry.type === 'url') {
          gameIframe.src = entry.url;
        } else {
          const created = createBlob(entry.html || '<!doctype html><html><body></body></html>');
          localBlob = created;
          gameIframe.src = created.url;
          // keep global reference for open-in-tab
          currentBlob = created;
        }
        gameArea && (gameArea.style.display = 'block');
      }

      // bind buttons
      if (gameLoadBtn) gameLoadBtn.addEventListener('click', loadEntry);
      if (gameNewTabBtn) gameNewTabBtn.addEventListener('click', ()=> {
        if (entry.type === 'url') window.open(entry.url, '_blank', 'noopener');
        else if (currentBlob && currentBlob.url) window.open(currentBlob.url, '_blank', 'noopener');
        else {
          const tmp = createBlob(entry.html || '<!doctype html><html><body></body></html>');
          window.open(tmp.url, '_blank', 'noopener');
          setTimeout(()=> { try{ tmp.revoke(); }catch(e){} }, 2000);
        }
      });
      if (gameAllowUnsafe) gameAllowUnsafe.addEventListener('change', loadEntry);

      // auto-load if preview option set
      if (entry.preview) setTimeout(loadEntry, 30);
    }

    // Preset embed pages: they reuse embed controls (embedFrame etc.)
    // If this is an embed/<key> route and embedFrame exists, wire Open-in-tab to preset url in the input
    if (route.startsWith('embed/') && embedFrame) {
      // find preset url from embedUrl input (prefilled by template)
      if (embedPreviewToggle) {
        embedPreviewToggle.addEventListener('click', ()=> {
          const embedAreaLocal = document.getElementById('embedArea');
          const showing = embedAreaLocal && embedAreaLocal.style.display !== 'none';
          embedPreviewToggle.textContent = showing ? 'Show Preview' : 'Hide Preview';
        });
      }
      if (embedNewTab && embedUrlInput) {
        embedNewTab.addEventListener('click', ()=> {
          const u = embedUrlInput.value.trim();
          if (u) window.open(u, '_blank', 'noopener');
        });
      }
    }
  }

  // main router
  function router(){
    const { route, params } = parseHash(location.hash);
    renderRoute(route, params);
  }

  window.addEventListener('hashchange', router);
  document.addEventListener('DOMContentLoaded', ()=> {
    if (!location.hash) location.hash = '#/home';
    router();
  });

  // reset button behavior
  document.querySelectorAll('#themeReset').forEach(btn => {
    btn.addEventListener('click', ()=> {
      try { localStorage.removeItem('sidebarCollapsed'); } catch(e){}
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
