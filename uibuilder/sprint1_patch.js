/* ============================================================
   SPRINT 1 PATCH — Sakti
   Fitur: 1) Export Runtime JS (app beneran bisa diklik)
           2) Alignment Guides saat drag
           3) Auto-Refresh Preview saat edit
   Di-load SETELAH uibuilder.html agar bisa override fungsi global.
   ============================================================ */
(function () {
  if (typeof components === 'undefined') return; // guard

  /* ---------- INJECT CSS: alignment guides ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .align-guide { position:absolute; background:#ff3b8b; pointer-events:none; z-index:9999; opacity:0.9; }
    .align-guide.h { height:0; border-top:1px dashed #ff3b8b; left:0; right:0; }
    .align-guide.v { width:0; border-left:1px dashed #ff3b8b; top:0; bottom:0; }
    #livePrevBtn.active { color:#ff3b8b; }
  `;
  document.head.appendChild(style);

  const canvasWrap = canvas;

  /* ============================================================
     FITUR 2: ALIGNMENT GUIDES (override startDragElement)
     ============================================================ */
  window.startDragElement = function (e, id) {
    const comp = components.find(c => c.id === id);
    if (!comp || comp.el.style.position === 'relative') return;

    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX - rect.left - comp.x;
    const startY = e.clientY - rect.top - comp.y;

    const guideH = document.createElement('div'); guideH.className = 'align-guide h'; guideH.style.display = 'none'; canvas.appendChild(guideH);
    const guideV = document.createElement('div'); guideV.className = 'align-guide v'; guideV.style.display = 'none'; canvas.appendChild(guideV);
    const SNAP = 6;

    function dragging(ev) {
      let x = Math.round((ev.clientX - rect.left - startX) / GRID_SIZE) * GRID_SIZE;
      let y = Math.round((ev.clientY - rect.top - startY) / GRID_SIZE) * GRID_SIZE;
      x = Math.max(0, Math.min(x, rect.width - comp.el.offsetWidth));
      y = Math.max(0, Math.min(y, rect.height - comp.el.offsetHeight));

      guideH.style.display = 'none'; guideV.style.display = 'none';
      const cw = comp.el.offsetWidth, ch = comp.el.offsetHeight;

      components.forEach(o => {
        if (o.id === id || o.el.style.position === 'relative') return;
        const ox = o.x, oy = o.y, ow = o.el.offsetWidth, oh = o.el.offsetHeight;
        if (Math.abs(x - ox) < SNAP) { x = ox; guideV.style.display = 'block'; guideV.style.left = ox + 'px'; }
        else if (Math.abs((x + cw) - (ox + ow)) < SNAP) { x = ox + ow - cw; guideV.style.display = 'block'; guideV.style.left = (x + cw) + 'px'; }
        else if (Math.abs((x + cw / 2) - (ox + ow / 2)) < SNAP) { x = ox + ow / 2 - cw / 2; guideV.style.display = 'block'; guideV.style.left = (x + cw / 2) + 'px'; }
        if (Math.abs(y - oy) < SNAP) { y = oy; guideH.style.display = 'block'; guideH.style.top = oy + 'px'; }
        else if (Math.abs((y + ch) - (oy + oh)) < SNAP) { y = oy + oh - ch; guideH.style.display = 'block'; guideH.style.top = (y + ch) + 'px'; }
        else if (Math.abs((y + ch / 2) - (oy + oh / 2)) < SNAP) { y = oy + oh / 2 - ch / 2; guideH.style.display = 'block'; guideH.style.top = (y + ch / 2) + 'px'; }
      });

      comp.el.style.left = x + 'px';
      comp.el.style.top = y + 'px';
      comp.x = x; comp.y = y;
    }
    function dragEnd(ev) {
      comp.el.releasePointerCapture(ev.pointerId);
      document.removeEventListener('pointermove', dragging);
      document.removeEventListener('pointerup', dragEnd);
      guideH.remove(); guideV.remove();
      saveHistory();
    }
    document.addEventListener('pointermove', dragging);
    document.addEventListener('pointerup', dragEnd);
  };

  /* ============================================================
     FITUR 1: EXPORT RUNTIME JS (app beneran, bukan markup mati)
     ============================================================ */
  window.generatePureHTMLCode = async function () {
    const state = JSON.parse(JSON.stringify(appVariables));
    let body = '';
    components.forEach(c => {
      const p = c.props || {};
      const px = `left:${c.x}px;top:${c.y}px;`;
      let inner = '';
      if (c.type === 'text' || c.type === 'button') inner = `<span class="inner-text-node">${parseExpressionBinding(p.text) || ''}</span>`;
      else if (c.type === 'input') inner = `<input type="text" placeholder="${p.placeholder || ''}" value="${state[p.targetVariable] || ''}"/>`;
      else if (c.type === 'image') inner = p.src ? `<img src="${p.src}" alt="${p.alt || ''}" style="max-width:100%;"/>` : '🖼️ Gambar';
      const dataAttrs = `data-type="${c.type}" data-target="${p.targetVariable || 'none'}" data-op="${p.operation || 'set'}" data-expr="${p.expressionValue || ''}" data-text="${p.text || ''}" data-ph="${p.placeholder || ''}" data-fp="${p.fallbackParam || ''}"`;
      body += `<div class="cmp cmp-${c.type}" ${dataAttrs} style="position:absolute;${px}${c.el.style.cssText}">${inner}</div>`;
    });

    const runtimeJS = `(function(){
      var state = ${JSON.stringify(state)};
      function parseExpr(s){ if(!s) return ''; return s.replace(/\\{\\{(\\w+)\\}\\}/g, function(m,k){ return state[k]!==undefined? state[k] : m; }); }
      function renderAll(){
        document.querySelectorAll('.cmp').forEach(function(el){
          var t=el.dataset.type, target=el.dataset.target;
          if(t==='text'||t==='button'){ var n=el.querySelector('.inner-text-node'); if(n) n.textContent=parseExpr(el.dataset.text); }
          if(t==='input'){ var i=el.querySelector('input'); if(i) i.value = state[target]!==undefined? state[target] : ''; }
        });
      }
      document.querySelectorAll('.cmp').forEach(function(el){
        var t=el.dataset.type, target=el.dataset.target, op=el.dataset.op, expr=el.dataset.expr;
        if(t==='input'){ var i=el.querySelector('input'); if(i) i.addEventListener('input', function(e){ state[target]=e.target.value; renderAll(); }); }
        if(t==='button'){ el.addEventListener('click', function(){ if(target && target!=='none'){ var d=parseExpr(expr); if(!isNaN(d) && d!=='') d=Number(d); if(op==='add') state[target]=(Number(state[target])||0)+d; else state[target]=d; } renderAll(); var fp=el.dataset.fp; if(fp) alert(fp); }); }
      });
      renderAll();
    })();`;

    const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>App Export</title><style>body{margin:0;padding:16px;font-family:sans-serif;position:relative;min-height:100vh;}.cmp{position:absolute;box-sizing:border-box;border-radius:12px;}.cmp-button{background:#5c5cf0;color:#fff;border:none;font-weight:600;padding:10px 20px;text-align:center;cursor:pointer;}.cmp-input{background:#fff;border:2px solid #ccd;padding:8px 12px;}.cmp-container{background:#eaedf5;padding:16px;border-radius:16px;}.cmp-image{display:flex;align-items:center;justify-content:center;background:#f1f3f9;color:#888;min-width:80px;min-height:60px;border-radius:8px;}.inner-text-node{display:block;}</style></head><body>${body}<script>${runtimeJS}<\/script></body></html>`;

    codeContent.textContent = doc;
    try { await navigator.clipboard.writeText(doc); if (typeof app !== 'undefined') app.ShowPopup('Kode runtime (bisa diklik) disalin!'); } catch (e) {}
  };

  /* ============================================================
     FITUR 3: AUTO-REFRESH PREVIEW (MutationObserver + prop input)
     ============================================================ */
  let _t;
  function scheduleRender() { if (isPreviewMode) { clearTimeout(_t); _t = setTimeout(() => executeRuntimeRender(), 150); } }
  const mo = new MutationObserver(scheduleRender);
  mo.observe(canvas, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  document.getElementById('propContent')?.addEventListener('input', scheduleRender);

  /* ---------- Tambah tombol LIVE di nav ---------- */
  const nav = document.querySelector('#bottom-nav');
  if (nav && !document.getElementById('livePrevBtn')) {
    const b = document.createElement('button');
    b.className = 'nav-item'; b.id = 'livePrevBtn';
    b.innerHTML = '<div class="icon-wrapper">🔄</div><span>Live</span>';
    b.onclick = () => {
      if (isPreviewMode) { closePreview(); b.classList.remove('active'); }
      else { togglePreview(); b.classList.add('active'); }
    };
    nav.appendChild(b);
  }

  if (typeof app !== 'undefined') app.ShowPopup('Sprint 1 aktif: Runtime Export + Guides + Live Preview');
})();
