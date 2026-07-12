/* ==========================================================================
   boot.js — the startup sequence.
   Types out a fake diagnostic log, fills a progress bar, then reveals
   the desktop. Exposes window.DriftBoot.run() so main.js / reboot
   can trigger it on demand.
   ========================================================================== */
(function () {
  const LOG_LINES = [
    { text: 'DRIFT/OS  boot v2.4', cls: 'cyan' },
    { text: '----------------------------------------', cls: 'dim' },
    { text: 'checking memory ................ 65536K OK', cls: 'ok' },
    { text: 'mounting virtual filesystem ..... /home /var /tmp', cls: 'dim' },
    { text: 'starting window compositor ...... ok', cls: 'ok' },
    { text: 'loading input drivers ........... keyboard, pointer', cls: 'dim' },
    { text: 'starting network daemon ......... ok', cls: 'ok' },
    { text: 'spawning shell ................... /bin/drift-shell', cls: 'dim' },
    { text: 'reticulating splines ............ done', cls: 'warn' },
    { text: '', cls: 'dim' },
    { text: 'welcome to DRIFT.', cls: 'cyan' },
  ];

  const logEl = document.getElementById('boot-log');
  const fillEl = document.getElementById('boot-bar-fill');
  const bootScreen = document.getElementById('boot-screen');
  const desktop = document.getElementById('desktop');

  function typeLine(line, cb) {
    const span = document.createElement('div');
    span.className = 'term-line ' + (line.cls || '');
    logEl.appendChild(span);
    let i = 0;
    const speed = 8; // ms per char
    (function step() {
      span.textContent = line.text.slice(0, i);
      i++;
      if (i <= line.text.length) {
        setTimeout(step, speed);
      } else {
        cb();
      }
    })();
  }

  function run(onDone) {
    logEl.innerHTML = '';
    fillEl.style.width = '0%';
    bootScreen.style.display = 'flex';
    desktop.hidden = true;

    let idx = 0;
    const total = LOG_LINES.length;

    function next() {
      if (idx >= total) {
        finish();
        return;
      }
      typeLine(LOG_LINES[idx], () => {
        idx++;
        fillEl.style.width = Math.round((idx / total) * 100) + '%';
        setTimeout(next, 90);
      });
    }

    function finish() {
      setTimeout(() => {
        bootScreen.style.transition = 'opacity 0.4s ease';
        bootScreen.style.opacity = '0';
        setTimeout(() => {
          bootScreen.style.display = 'none';
          bootScreen.style.opacity = '1';
          desktop.hidden = false;
          if (typeof onDone === 'function') onDone();
        }, 400);
      }, 350);
    }

    next();
  }

  window.DriftBoot = { run };
})();
