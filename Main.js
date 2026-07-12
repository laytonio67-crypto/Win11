/* ==========================================================================
   main.js — glues boot.js, windowManager.js and apps.js together.
   ========================================================================== */
(function () {
  const launcherBtn = document.getElementById('launcher-btn');
  const launcherMenu = document.getElementById('launcher-menu');
  const clockEl = document.getElementById('topbar-clock');
  const rebootBtn = document.getElementById('reboot-btn');

  const openIds = {}; // appId -> windowId, so icons/launcher focus instead of duplicate

  function launchApp(appId) {
    const def = window.APPS[appId];
    if (!def) return;

    if (openIds[appId]) {
      window.WM.restore(openIds[appId]);
      window.WM.focus(openIds[appId]);
      return;
    }

    const id = window.WM.open({
      title: def.title,
      glyph: def.glyph,
      width: def.width,
      height: def.height,
      render: def.render,
      onClose: () => { openIds[appId] = null; },
    });
    openIds[appId] = id;
  }

  function bindLaunchTargets() {
    document.querySelectorAll('[data-app]').forEach((el) => {
      el.addEventListener('click', () => {
        launchApp(el.dataset.app);
        launcherMenu.hidden = true;
        launcherBtn.classList.remove('active');
      });
    });
  }

  function toggleLauncher() {
    launcherMenu.hidden = !launcherMenu.hidden;
    launcherBtn.classList.toggle('active', !launcherMenu.hidden);
  }

  launcherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLauncher();
  });

  document.addEventListener('click', (e) => {
    if (!launcherMenu.hidden && !launcherMenu.contains(e.target) && e.target !== launcherBtn) {
      launcherMenu.hidden = true;
      launcherBtn.classList.remove('active');
    }
  });

  function tickClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss}`;
  }

  rebootBtn.addEventListener('click', () => {
    launcherMenu.hidden = true;
    document.getElementById('window-layer').innerHTML = '';
    document.getElementById('taskbar-running').innerHTML = '';
    for (const k in openIds) delete openIds[k];
    window.DriftBoot.run();
  });

  bindLaunchTargets();
  setInterval(tickClock, 1000);
  tickClock();

  window.DriftBoot.run(() => {
    // opened automatically on first boot, purely optional — leaving desktop empty
  });
})();
