/* ==========================================================================
   apps.js — built-in applications.
   Each entry in APPS defines how WM.open() should build that app's window.
   Add new apps by adding another key here and a launcher/icon in index.html.
   ========================================================================== */
(function () {

  const FAKE_FILES = {
    Home: [
      { name: 'notes.txt', kind: 'file' },
      { name: 'projects', kind: 'dir' },
      { name: 'readme.md', kind: 'file' },
    ],
    Documents: [
      { name: 'resume.pdf', kind: 'file' },
      { name: 'drift-os-spec.txt', kind: 'file' },
    ],
    System: [
      { name: 'kernel.bin', kind: 'file' },
      { name: 'drivers', kind: 'dir' },
      { name: 'config.json', kind: 'file' },
    ],
  };

  /* ---------------- Terminal ---------------- */
  function renderTerminal(bodyEl) {
    bodyEl.innerHTML = `<div class="app-terminal">
      <div class="term-log"></div>
      <div class="term-input-row"><span class="term-prompt">guest@drift:~$</span> <input type="text" autocomplete="off" spellcheck="false" /></div>
    </div>`;
    const log = bodyEl.querySelector('.term-log');
    const input = bodyEl.querySelector('input');

    function print(text) {
      const line = document.createElement('div');
      line.className = 'term-line';
      line.textContent = text;
      log.appendChild(line);
      bodyEl.querySelector('.app-terminal').scrollTop = 999999;
    }

    print('DRIFT terminal — type "help" for commands.');

    const commands = {
      help: () => 'Available: help, about, date, echo <text>, whoami, ls, clear',
      about: () => 'DRIFT/OS — a web-based desktop environment, built with plain HTML/CSS/JS.',
      date: () => new Date().toString(),
      whoami: () => 'guest',
      ls: () => Object.keys(FAKE_FILES).join('   '),
      clear: () => { log.innerHTML = ''; return null; },
    };

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const raw = input.value;
      input.value = '';
      print('guest@drift:~$ ' + raw);
      const [cmd, ...rest] = raw.trim().split(/\s+/);
      if (!cmd) return;
      if (cmd === 'echo') { print(rest.join(' ')); return; }
      if (commands[cmd]) {
        const out = commands[cmd]();
        if (out) print(out);
      } else {
        print(`command not found: ${cmd}`);
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  /* ---------------- Notepad ---------------- */
  function renderNotepad(bodyEl) {
    bodyEl.style.position = 'relative';
    bodyEl.innerHTML = `<div class="app-notepad" style="height:100%;">
      <textarea placeholder="Start typing...">Welcome to Notepad.

This text lives only in memory for this session —
wire it up to localStorage or a backend if you want it to persist.</textarea>
      <div class="notepad-statusbar"><span class="char-count">0 characters</span></div>
    </div>`;
    const textarea = bodyEl.querySelector('textarea');
    const counter = bodyEl.querySelector('.char-count');
    function updateCount() { counter.textContent = textarea.value.length + ' characters'; }
    textarea.addEventListener('input', updateCount);
    updateCount();
  }

  /* ---------------- Files ---------------- */
  function renderFiles(bodyEl) {
    bodyEl.innerHTML = `<div class="app-files">
      <div class="files-tree"></div>
      <div class="files-list"></div>
    </div>`;
    const tree = bodyEl.querySelector('.files-tree');
    const list = bodyEl.querySelector('.files-list');

    function show(folder) {
      list.innerHTML = '';
      FAKE_FILES[folder].forEach((f) => {
        const entry = document.createElement('div');
        entry.className = 'file-entry';
        entry.innerHTML = `<div class="file-glyph">${f.kind === 'dir' ? '▤' : '▫'}</div><div class="file-name">${f.name}</div>`;
        list.appendChild(entry);
      });
      tree.querySelectorAll('.files-tree-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.folder === folder);
      });
    }

    Object.keys(FAKE_FILES).forEach((folder, i) => {
      const item = document.createElement('div');
      item.className = 'files-tree-item';
      item.textContent = folder;
      item.dataset.folder = folder;
      item.addEventListener('click', () => show(folder));
      tree.appendChild(item);
      if (i === 0) show(folder);
    });
  }

  /* ---------------- Calculator ---------------- */
  function renderCalculator(bodyEl) {
    bodyEl.innerHTML = `<div class="app-calc">
      <div class="calc-display">0</div>
      <div class="calc-grid"></div>
    </div>`;
    const display = bodyEl.querySelector('.calc-display');
    const grid = bodyEl.querySelector('.calc-grid');

    const keys = [
      'C', '±', '%', '÷',
      '7', '8', '9', '×',
      '4', '5', '6', '−',
      '1', '2', '3', '+',
      '0', '.', '=',
    ];

    let current = '0';
    let stored = null;
    let pendingOp = null;
    let overwrite = true;

    function render() { display.textContent = current; }

    function applyOp(a, op, b) {
      switch (op) {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? 0 : a / b;
        default: return b;
      }
    }

    keys.forEach((key) => {
      const btn = document.createElement('button');
      btn.className = 'calc-btn' + (['÷', '×', '−', '+'].includes(key) ? ' op' : '') + (key === '=' ? ' eq' : '');
      btn.textContent = key;
      if (key === '0') btn.style.gridColumn = 'span 2';
      btn.addEventListener('click', () => {
        if (key >= '0' && key <= '9') {
          current = overwrite ? key : (current === '0' ? key : current + key);
          overwrite = false;
        } else if (key === '.') {
          if (overwrite) { current = '0.'; overwrite = false; }
          else if (!current.includes('.')) current += '.';
        } else if (key === 'C') {
          current = '0'; stored = null; pendingOp = null; overwrite = true;
        } else if (key === '±') {
          current = String(parseFloat(current) * -1);
        } else if (key === '%') {
          current = String(parseFloat(current) / 100);
        } else if (['÷', '×', '−', '+'].includes(key)) {
          stored = stored === null ? parseFloat(current) : applyOp(stored, pendingOp, parseFloat(current));
          pendingOp = key;
          overwrite = true;
          current = String(stored);
        } else if (key === '=') {
          if (pendingOp !== null) {
            stored = applyOp(stored, pendingOp, parseFloat(current));
            current = String(stored);
            pendingOp = null;
            overwrite = true;
          }
        }
        render();
      });
      grid.appendChild(btn);
    });
  }

  /* ---------------- About ---------------- */
  function renderAbout(bodyEl) {
    bodyEl.innerHTML = `<div class="app-about">
      <h2>DRIFT/OS</h2>
      <div class="about-sub">a desktop environment that lives in a browser tab</div>
      <dl>
        <dt>Version</dt><dd>2.4.0</dd>
        <dt>Engine</dt><dd>vanilla HTML / CSS / JS — no framework, no build step</dd>
        <dt>Windowing</dt><dd>custom window manager (js/windowManager.js)</dd>
        <dt>License</dt><dd>MIT — see LICENSE</dd>
        <dt>Source</dt><dd>github.com/your-username/your-repo</dd>
      </dl>
    </div>`;
  }

  window.APPS = {
    terminal:   { title: 'Terminal',   glyph: '&gt;_', width: 480, height: 320, render: renderTerminal },
    notepad:    { title: 'Notepad',    glyph: '✎',     width: 460, height: 360, render: renderNotepad },
    files:      { title: 'Files',      glyph: '▤',     width: 500, height: 340, render: renderFiles },
    calculator: { title: 'Calculator', glyph: '#',     width: 280, height: 400, render: renderCalculator },
    about:      { title: 'About Drift',glyph: 'i',     width: 380, height: 300, render: renderAbout },
  };
})();
