/* ==========================================================================
   windowManager.js — a small window manager for the desktop.
   Public API: window.WM.open(config) -> windowId
               window.WM.close(id)
               window.WM.focus(id)
               window.WM.minimize(id)
   ========================================================================== */
(function () {
  const layer = document.getElementById('window-layer');
  const taskbarRunning = document.getElementById('taskbar-running');
  const topbarAppname = document.getElementById('topbar-appname');

  let zCounter = 10;
  let winCounter = 0;
  const windows = {}; // id -> { el, taskbarEl, config, minimized }

  let offsetStep = 0;

  function open(config) {
    // config: { title, glyph, width, height, render(bodyEl, api), appId }
    winCounter += 1;
    const id = 'win-' + winCounter;

    const width = config.width || 460;
    const height = config.height || 320;
    offsetStep = (offsetStep + 1) % 6;
    const left = 60 + offsetStep * 28;
    const top = 30 + offsetStep * 24;

    const el = document.createElement('div');
    el.className = 'window';
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.zIndex = ++zCounter;

    el.innerHTML = `
      <div class="window-titlebar">
        <div class="window-title">
          <span class="title-glyph">${config.glyph || '▢'}</span>
          <span class="title-text">${config.title || 'Window'}</span>
        </div>
        <div class="window-controls">
          <button class="win-btn min" title="Minimize"></button>
          <button class="win-btn max" title="Maximize"></button>
          <button class="win-btn close" title="Close"></button>
        </div>
      </div>
      <div class="window-body"></div>
      <div class="window-resize-handle"></div>
    `;

    layer.appendChild(el);

    const bodyEl = el.querySelector('.window-body');
    const titlebar = el.querySelector('.window-titlebar');
    const resizeHandle = el.querySelector('.window-resize-handle');
    const btnMin = el.querySelector('.win-btn.min');
    const btnMax = el.querySelector('.win-btn.max');
    const btnClose = el.querySelector('.win-btn.close');

    const taskEl = document.createElement('button');
    taskEl.className = 'taskbar-entry';
    taskEl.innerHTML = `<span class="dot"></span><span>${config.title}</span>`;
    taskbarRunning.appendChild(taskEl);

    windows[id] = { el, taskbarEl: taskEl, config, minimized: false };

    // --- interactions ---
    el.addEventListener('mousedown', () => focus(id));
    taskEl.addEventListener('click', () => {
      if (windows[id].minimized) {
        restore(id);
      } else if (topZ() === id) {
        minimize(id);
      } else {
        focus(id);
      }
    });

    btnClose.addEventListener('click', (e) => { e.stopPropagation(); close(id); });
    btnMin.addEventListener('click', (e) => { e.stopPropagation(); minimize(id); });
    btnMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMaximize(id); });
    titlebar.addEventListener('dblclick', () => toggleMaximize(id));

    makeDraggable(el, titlebar, id);
    makeResizable(el, resizeHandle);

    // let the app render its content
    const api = {
      close: () => close(id),
      setTitle: (t) => { el.querySelector('.title-text').textContent = t; taskEl.querySelector('span:last-child').textContent = t; },
    };
    if (typeof config.render === 'function') config.render(bodyEl, api);

    focus(id);
    return id;
  }

  function topZ() {
    let best = null, bestZ = -1;
    for (const id in windows) {
      const z = parseInt(windows[id].el.style.zIndex, 10);
      if (!windows[id].minimized && z > bestZ) { bestZ = z; best = id; }
    }
    return best;
  }

  function focus(id) {
    const w = windows[id];
    if (!w) return;
    w.el.style.zIndex = ++zCounter;
    for (const other in windows) {
      windows[other].el.classList.toggle('focused', other === id);
      windows[other].taskbarEl.classList.toggle('active', other === id);
    }
    topbarAppname.textContent = w.config.title;
  }

  function close(id) {
    const w = windows[id];
    if (!w) return;
    w.el.remove();
    w.taskbarEl.remove();
    delete windows[id];
    if (typeof w.config.onClose === 'function') w.config.onClose();
    const next = topZ();
    if (next) focus(next); else topbarAppname.textContent = 'Desktop';
  }

  function minimize(id) {
    const w = windows[id];
    if (!w) return;
    w.el.style.display = 'none';
    w.minimized = true;
    w.taskbarEl.classList.remove('active');
    const next = topZ();
    if (next) focus(next); else topbarAppname.textContent = 'Desktop';
  }

  function restore(id) {
    const w = windows[id];
    if (!w) return;
    w.el.style.display = 'flex';
    w.minimized = false;
    focus(id);
  }

  function toggleMaximize(id) {
    const w = windows[id];
    if (!w) return;
    const el = w.el;
    if (el.dataset.maxed === '1') {
      el.style.width = el.dataset.prevW;
      el.style.height = el.dataset.prevH;
      el.style.left = el.dataset.prevL;
      el.style.top = el.dataset.prevT;
      el.dataset.maxed = '0';
    } else {
      el.dataset.prevW = el.style.width;
      el.dataset.prevH = el.style.height;
      el.dataset.prevL = el.style.left;
      el.dataset.prevT = el.style.top;
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.left = '0';
      el.style.top = '0';
      el.dataset.maxed = '1';
    }
  }

  function makeDraggable(el, handle, id) {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('.win-btn')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      el.dataset.maxed = '0';
      focus(id);
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      el.style.left = (ox + (e.clientX - sx)) + 'px';
      el.style.top = Math.max(0, oy + (e.clientY - sy)) + 'px';
    });
    window.addEventListener('mouseup', () => { dragging = false; });
  }

  function makeResizable(el, handle) {
    let resizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
    handle.addEventListener('mousedown', (e) => {
      resizing = true;
      sx = e.clientX; sy = e.clientY;
      sw = el.offsetWidth; sh = el.offsetHeight;
      e.preventDefault();
      e.stopPropagation();
    });
    window.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      el.style.width = Math.max(280, sw + (e.clientX - sx)) + 'px';
      el.style.height = Math.max(180, sh + (e.clientY - sy)) + 'px';
    });
    window.addEventListener('mouseup', () => { resizing = false; });
  }

  window.WM = { open, close, focus, minimize, restore };
})();
