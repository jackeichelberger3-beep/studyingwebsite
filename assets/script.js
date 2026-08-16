/* assets/script.js
   Responsibilities:
   - Simple hash routing: expects hashes like "#/route?k=v&k2=v2"
   - Renders templates defined in window.TEMPLATES (assets/pages.js)
   - Manages sidebar collapse/overlay behavior and saves collapse state in localStorage
   - Keeps code minimal and annotated for easy editing
*/

(() => {
  const app = document.querySelector('.app');
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('overlay');
  const mainTitle = document.getElementById('pageTitle');
  const mainSubtitle = document.getElementById('pageSubtitle');
  const content = document.getElementById('appContent');
  const navLinks = document.querySelectorAll('.nav-link');

  // Load saved collapsed state
  const saved = localStorage.getItem('sidebarCollapsed') === 'true';
  if (saved) app.classList.add('collapsed');

  // Toggle click behavior: mobile opens overlay, desktop toggles collapse
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

  // Close overlay on click
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    setTimeout(()=> overlay.hidden = true, 250);
    toggle.setAttribute('aria-expanded', 'false');
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) overlay.click();
  });

  // Close mobile sidebar when a nav link is clicked
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width:900px)').matches) overlay.click();
    });
  });

  // Resize handler: if we leave mobile, ensure overlay cleared
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

  // Simple hash parsing: returns { route, params } where params is an object of strings
  function parseHash(hash) {
    // expected "#/route?k=v&k2=v2" or "#/route" or "" (empty)
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

  // Render route using TEMPLATES map from assets/pages.js
  function renderFromHash() {
    const { route, params } = parseHash(location.hash);
    const templateFn = window.TEMPLATES && window.TEMPLATES[route] ? window.TEMPLATES[route] : window.TEMPLATES.home;
    const page = templateFn(params || {});
    mainTitle.textContent = page.title || 'Untitled';
    mainSubtitle.textContent = page.subtitle || '';
    content.innerHTML = page.html || '';
    // mark active nav link for visual feedback
    document.querySelectorAll('.nav-link').forEach(a => {
      const aRoute = a.getAttribute('data-route') || a.getAttribute('href')?.split('?')[0]?.replace('#/','');
      if (aRoute && aRoute === route) a.classList.add('active'); else a.classList.remove('active');
    });
  }

  // Initialize
  window.addEventListener('hashchange', renderFromHash);
  document.addEventListener('DOMContentLoaded', () => {
    // Render current route
    if (!location.hash) location.hash = '#/home';
    renderFromHash();
  });

  // Reset button to clear localStorage preference
  document.querySelectorAll('#themeReset').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('sidebarCollapsed');
      app.classList.remove('collapsed');
    });
  });
})();
