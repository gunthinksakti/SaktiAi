/* ============================================================
   SPRINT 3 PATCH — Sakti
   1) Plugin API  (registerPlugin + public SaktiUI)
   2) Theme Switcher (Light / Dark / Neon / Mono)
   3) Accessibility Checker
   Load SETELAH sprint2_patch.js.
   ============================================================ */
(function () {
  if (typeof components === 'undefined') return;

  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #themeBtn { background:linear-gradient(135deg,#ff8a00,#e52e71)!important; color:#fff!important; border:none; padding:10px; border-radius:8px; width:100%; margin-bottom:10px; cursor:pointer; font-weight:600; }
    #a11ySheet .acc-item { padding:10px 12px; border-radius:8px; margin-bottom:8px; font-size:13px; }
    .acc-ok { background:rgba(168,255,178,0.1); border:1px solid var(--md-success); }
    .acc-warn { background:rgba(255,180,171,0.1); border:1px solid var(--md-error); }
    .fab-child-item.plugin { opacity:0.95; }
  `;
  document.head.appendChild(style);

  /* =========================================================
     FITUR 1: PLUGIN API
     ========================================================= */
  window.SaktiUI = {
    createComponent, addElement, components, canvas, appVariables,
    saveHistory, updateUI, openSheet, closeAllSheets,
    showPopup: (m) => { if (typeof app !== 'undefined') app.ShowPopup(m); }
  };

  const plugins = [];
  window.registerPlugin = function (p) {
    if (!p || !p.id) return false;
    if (plugins.find(x => x.id === p.id)) return false;
    plugins.push(p);
    // inject FAB button
    const fab = document.querySelector('.fab-child-list');
    if (fab) {
      const item = document.createElement('div');
      item.className = 'fab-child-item plugin';
      item.innerHTML = `<span class="fab-label">${p.label || p.id}</span><button class="fab-child" onclick="SaktiUI.pluginCreate('${p.id}')">${p.icon || '🔌'}</button>`;
      fab.appendChild(item);
    }
    SaktiUI.showPopup('Plugin terpasang: ' + (p.label || p.id));
    return true;
  };
  window.SaktiUI.pluginCreate = function (id) {
    const p = plugins.find(x => x.id === id);
    if (p && typeof p.onCreate === 'function') p.onCreate({ SaktiUI: window.SaktiUI, x: 30 + Math.floor(Math.random() * 60), y: 40 + Math.floor(Math.random() * 60) });
  };

  // Contoh plugin built-in: Star Rating
  registerPlugin({
    id: 'star-rating', label: 'Rating Bintang', icon: '⭐',
    onCreate({ SaktiUI, x, y }) {
      const c = SaktiUI.createComponent('text', { x, y });
      c.props.text = '{{rating}} / 5 ⭐';
      SaktiUI.appVariables['rating'] = '0';
      const n = c.el.querySelector('.inner-text-node'); if (n) n.textContent = '0 / 5 ⭐';
      SaktiUI.saveHistory(); SaktiUI.updateUI();
    }
  });

  /* =========================================================
     FITUR 2: THEME SWITCHER
     ========================================================= */
  const THEMES = {
    Dark: null,
    Light: { '--md-surface': '#ffffff', '--md-on-surface': '#121318', '--md-surface-container': '#f1f3f9', '--md-surface-container-high': '#e8eaf0', '--md-primary': '#5c5cf0', '--md-primary-container': '#e0e0ff', '--md-outline': '#8f9099' },
    Neon: { '--md-surface': '#0a0a12', '--md-on-surface': '#00ffd5', '--md-surface-container': '#12121f', '--md-surface-container-high': '#1c1c2e', '--md-primary': '#ff2bd6', '--md-primary-container': '#2a0033', '--md-outline': '#ff2bd6' },
    Mono: { '--md-surface': '#1a1a1a', '--md-on-surface': '#e0e0e0', '--md-surface-container': '#262626', '--md-surface-container-high': '#333', '--md-primary': '#bdbdbd', '--md-primary-container': '#444', '--md-outline': '#777' }
  };
  let themeIdx = 0;
  const themeNames = Object.keys(THEMES);

  window.applyTheme = function (name) {
    const t = THEMES[name];
    if (!t) { document.documentElement.removeAttribute('style'); }
    else { Object.entries(t).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)); }
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = '🎨 Tema: ' + name + ' (klik ganti)';
  };
  window.cycleTheme = function () { themeIdx = (themeIdx + 1) % themeNames.length; applyTheme(themeNames[themeIdx]); };

  // Inject theme button into projectSheet
  const ps = document.getElementById('projectSheet');
  if (ps) {
    const btn = document.createElement('button');
    btn.id = 'themeBtn'; btn.textContent = '🎨 Tema: Dark (klik ganti)';
    btn.onclick = cycleTheme;
    ps.querySelector('.sheet-content').insertBefore(btn, ps.querySelector('.prop-group'));
  }

  /* =========================================================
     FITUR 3: ACCESSIBILITY CHECKER
     ========================================================= */
  function lum(hex) {
    hex = (hex || '').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substr(0, 2), 16) || 0, g = parseInt(hex.substr(2, 2), 16) || 0, b = parseInt(hex.substr(4, 2), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  function contrast(a, b) { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }

  window.runA11yCheck = function () {
    const issues = [];
    components.forEach(c => {
      const p = c.props || {};
      const tag = `${c.type.toUpperCase()} #${c.id}`;
      if (c.type === 'image') {
        if (!p.src) issues.push(['warn', tag + ': gambar tanpa URL source.']);
        if (!p.alt) issues.push(['warn', tag + ': gambar tanpa teks alt.']);
      }
      if (c.type === 'input') {
        if (!p.placeholder && (!p.targetVariable || p.targetVariable === 'none')) issues.push(['warn', tag + ': input tanpa placeholder & tidak ter-binding.']);
      }
      if ((c.type === 'text' || c.type === 'button') && !p.text) issues.push(['warn', tag + ': teks kosong.']);
      // contrast
      const bg = p.bg || '#f1f3f9', fg = p.color || '#121318';
      const cr = contrast(bg, fg);
      if (cr < 3) issues.push(['warn', tag + ': kontras rendah (' + cr.toFixed(2) + ':1).']);
    });
    const wrap = document.getElementById('a11yList');
    if (!wrap) return;
    if (!issues.length) { wrap.innerHTML = '<div class="acc-item acc-ok">✅ Semua elemen lolos cek aksesibilitas dasar.</div>'; }
    else { wrap.innerHTML = issues.map(i => `<div class="acc-item acc-warn">⚠️ ${i[1]}</div>`).join(''); }
    openSheet('a11ySheet');
  };

  // Inject a11y sheet + nav button
  const sheet = document.createElement('div');
  sheet.className = 'bottom-sheet'; sheet.id = 'a11ySheet';
  sheet.innerHTML = '<div class="drag-handle"></div><h3>♿ Accessibility Checker</h3><div class="sheet-content" id="a11yList"></div>';
  document.body.appendChild(sheet);

  const nb = document.querySelector('#bottom-nav');
  if (nb && !document.getElementById('a11yNavBtn')) {
    const b = document.createElement('button');
    b.className = 'nav-item'; b.id = 'a11yNavBtn';
    b.innerHTML = '<div class="icon-wrapper">♿</div><span>A11y</span>';
    b.onclick = () => runA11yCheck();
    nb.appendChild(b);
  }

  SaktiUI.showPopup('Sprint 3 aktif: Plugin API + Theme + A11y');
})();
