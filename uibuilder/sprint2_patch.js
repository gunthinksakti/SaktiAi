/* ============================================================
   SPRINT 2 PATCH — Sakti
   1) Reactive Variable Store (live update preview + computed {{a*b}})
   2) Undo/Redo Visual + Shortcut Ctrl+Z / Ctrl+Y + Step Indicator
   3) Component Library (save/load reusable component -> localStorage)
   Load SETELAH sprint1_patch.js.
   ============================================================ */
(function () {
  if (typeof components === 'undefined') return;

  /* ---------- CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #histInd { margin:0 8px; font-size:12px; color:#000; font-weight:600; }
    #saveLibBtn { background:#8a5cf0!important; color:#fff!important; border:none; padding:10px; border-radius:8px; width:100%; margin-top:10px; cursor:pointer; font-weight:600; }
    .lib-item { padding:12px; border:1px solid rgba(255,255,255,0.1); border-radius:10px; margin-bottom:8px; cursor:pointer; background:rgba(255,255,255,0.03); }
    .lib-item:hover { border-color:var(--md-primary); }
    .lib-item small { color:var(--md-outline); }
  `;
  document.head.appendChild(style);

  /* =========================================================
     FITUR 1: REACTIVE VARIABLE STORE
     ========================================================= */
  // Upgrade parseExpressionBinding -> support computed math {{a * b}}
  window.parseExpressionBinding = function (str) {
    if (!str) return '';
    return str.replace(/\{\{(.*?)\}\}/g, (m, expr) => {
      const e = expr.trim();
      if (runtimeState[e] !== undefined) return runtimeState[e];
      if (appVariables[e] !== undefined) return appVariables[e];
      // computed: only allow safe math chars + known vars
      if (/^[a-zA-Z0-9_+\-*/%.\s()]+$/.test(e)) {
        try {
          const names = Object.keys(appVariables);
          const vals = names.map(k => appVariables[k]);
          const fn = new Function(...names, 'return (' + e + ');');
          const r = fn(...vals);
          if (typeof r === 'number' && !isNaN(r)) return r;
        } catch (_) {}
      }
      return m;
    });
  };

  // Variable manager edits -> live re-render preview if open
  ['updateStateValue', 'addNewStateVariable', 'deleteStateKey', 'renameStateKey'].forEach(fn => {
    const orig = window[fn];
    if (orig) window[fn] = function () { orig.apply(this, arguments); if (isPreviewMode) executeRuntimeRender(); };
  });

  /* =========================================================
     FITUR 2: UNDO/REDO VISUAL + SHORTCUT
     ========================================================= */
  function updateHistoryIndicator() {
    const ind = document.getElementById('histInd');
    if (ind) ind.textContent = 'Langkah ' + (historyIndex + 1) + '/' + history.length;
  }

  const _sh = window.saveHistory;
  window.saveHistory = function () { _sh.apply(this, arguments); updateHistoryIndicator(); };
  const _ua = window.undoAction;
  window.undoAction = function () { _ua.apply(this, arguments); updateHistoryIndicator(); };
  const _ra = window.redoAction;
  window.redoAction = function () { _ra.apply(this, arguments); updateHistoryIndicator(); };

  // Indicator di top-bar preview
  const tb = document.querySelector('#preview-overlay #top-bar');
  if (tb) {
    const ind = document.createElement('span');
    ind.id = 'histInd';
    tb.insertBefore(ind, tb.lastElementChild);
    updateHistoryIndicator();
  }

  // Shortcut keyboard
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z' && !e.shiftKey) { e.preventDefault(); undoAction(); }
    else if ((e.ctrlKey || e.metaKey) && (k === 'y' || (e.shiftKey && k === 'z'))) { e.preventDefault(); redoAction(); }
  });

  /* =========================================================
     FITUR 3: COMPONENT LIBRARY
     ========================================================= */
  const LIB_KEY = 'sakti_component_lib';
  function getLib() { try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch (e) { return []; } }
  function setLib(a) { localStorage.setItem(LIB_KEY, JSON.stringify(a)); }

  function applyPropsVisual(comp) {
    const el = comp.el, p = comp.props || {};
    if (p.bg) el.style.backgroundColor = p.bg;
    if (p.color) el.style.color = p.color;
    if (p.width) el.style.width = p.width;
    if (p.height) el.style.height = p.height;
    if ((comp.type === 'text' || comp.type === 'button') && p.text) {
      const n = el.querySelector('.inner-text-node'); if (n) n.textContent = p.text;
    }
    if (comp.type === 'input' && p.placeholder) {
      const s = el.querySelector('span'); if (s) s.textContent = p.placeholder;
    }
  }

  function saveCurrentToLib() {
    if (selectedId == null) return;
    const c = components.find(x => x.id === selectedId);
    if (!c) return;
    const lib = getLib();
    lib.push({ type: c.type, props: JSON.parse(JSON.stringify(c.props)) });
    setLib(lib); renderLibrary();
    if (typeof app !== 'undefined') app.ShowPopup('Tersimpan ke Library (' + lib.length + ')');
  }

  function renderLibrary() {
    const wrap = document.getElementById('libList');
    if (!wrap) return;
    const lib = getLib();
    wrap.innerHTML = lib.length
      ? lib.map((it, i) => `<div class="lib-item" onclick="useLibItem(${i})">📦 ${it.type.toUpperCase()}<br><small>${Object.keys(it.props).length} properti tersimpan</small></div>`).join('')
      : '<small style="color:var(--md-outline);padding:16px;display:block">Library kosong. Pilih elemen → ⭐ Simpan ke Library.</small>';
  }

  window.useLibItem = function (i) {
    const lib = getLib();
    const it = lib[i];
    if (!it) return;
    const comp = createComponent(it.type, { x: 30 + Math.floor(Math.random() * 50), y: 40 + Math.floor(Math.random() * 50) });
    comp.props = Object.assign(comp.props, JSON.parse(JSON.stringify(it.props)));
    applyPropsVisual(comp);
    saveHistory(); updateUI(); closeAllSheets();
    if (typeof app !== 'undefined') app.ShowPopup('Komponen ditambahkan');
  };

  // Inject Library sheet + nav button
  const sheet = document.createElement('div');
  sheet.className = 'bottom-sheet';
  sheet.id = 'librarySheet';
  sheet.innerHTML = '<div class="drag-handle"></div><h3>📚 Component Library</h3><div class="sheet-content" id="libList"></div>';
  document.body.appendChild(sheet);

  const nb = document.querySelector('#bottom-nav');
  if (nb && !document.getElementById('libNavBtn')) {
    const b = document.createElement('button');
    b.className = 'nav-item'; b.id = 'libNavBtn';
    b.innerHTML = '<div class="icon-wrapper">📚</div><span>Library</span>';
    b.onclick = () => { openSheet('librarySheet'); renderLibrary(); };
    nb.appendChild(b);
  }

  // Inject "Save to Library" button into inspector panel
  function injectSaveBtn() {
    const pc = document.getElementById('propContent');
    if (!pc || pc.querySelector('#saveLibBtn') || selectedId == null) return;
    const b = document.createElement('button');
    b.id = 'saveLibBtn';
    b.textContent = '⭐ Simpan ke Library';
    b.onclick = (e) => { e.stopPropagation(); saveCurrentToLib(); };
    pc.appendChild(b);
  }
  new MutationObserver(injectSaveBtn).observe(document.getElementById('propContent'), { childList: true, subtree: true });
  injectSaveBtn();

  if (typeof app !== 'undefined') app.ShowPopup('Sprint 2 aktif: Reactive Store + Undo Visual + Library');
})();
