/* ════════════════════════════════════════════════════
   TUTORIAL SYSTEM — first-time Day 1 walkthrough
   7 steps with spotlight, step indicator, and proper
   fixed-position layout independent of game scaling.
   Stored in localStorage['chk_tutorial_done']
════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'chk_tutorial_done';

  // Step definitions — targetId is the game element to highlight
  const STEPS = [
    { targetId: null,           titleKey: 'tutorial.step1.title', textKey: 'tutorial.step1.text'  },
    { targetId: 'doc-content',  titleKey: 'tutorial.step2.title', textKey: 'tutorial.step2.text'  },
    { targetId: 'doc-content',  titleKey: 'tutorial.step3.title', textKey: 'tutorial.step3.text'  },
    { targetId: 'right-panel',  titleKey: 'tutorial.step4.title', textKey: 'tutorial.step4.text'  },
    { targetId: 'right-panel',  titleKey: 'tutorial.step5.title', textKey: 'tutorial.step5.text'  },
    { targetId: 'action-bar',   titleKey: 'tutorial.step6.title', textKey: 'tutorial.step6.text'  },
    { targetId: 'moral-panel',  titleKey: 'tutorial.step7.title', textKey: 'tutorial.step7.text'  },
  ];

  let currentStep   = 0;
  let doneCallback  = null;
  let overlayEl     = null;
  let spotlightEl   = null;
  let cardEl        = null;

  // ── HELPERS ──────────────────────────────────────

  function isComplete() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  function markComplete() {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function T(key) {
    return (window.t && window.t(key)) || key;
  }

  // Get screen-space rect of a game element, accounting for the
  // letterbox scale applied by CSS transform on #app.
  function getScreenRect(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    return el.getBoundingClientRect();
  }

  // ── BUILD DOM ─────────────────────────────────────

  function buildOverlay() {
    // Full-screen fixed overlay — lives outside the scaled #app
    overlayEl = document.createElement('div');
    overlayEl.id = 'tut-overlay';
    overlayEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'pointer-events:none',
    ].join(';');

    // Spotlight: a transparent box that punches a hole in the dimmer.
    // The dimmer is implemented as a box-shadow on the spotlight element.
    spotlightEl = document.createElement('div');
    spotlightEl.id = 'tut-spotlight';
    spotlightEl.style.cssText = [
      'position:absolute',
      'border-radius:4px',
      'border:2px solid #00d4ff',
      'box-shadow:0 0 0 9999px rgba(0,0,0,0.82)',
      'transition:left 0.3s ease,top 0.3s ease,width 0.3s ease,height 0.3s ease',
      'animation:tut-pulse 1.2s ease-in-out infinite',
      'pointer-events:none',
    ].join(';');

    // Modal card — centred, pointer-events on
    cardEl = document.createElement('div');
    cardEl.id = 'tut-card';
    cardEl.style.cssText = [
      'position:fixed',
      'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)',
      'width:min(560px,90vw)',
      'background:#1a1a1f',
      'border:1px solid rgba(0,212,255,0.25)',
      'padding:32px 36px 28px',
      'box-shadow:0 0 40px rgba(0,0,0,0.8)',
      'font-family:\'Press Start 2P\',\'Courier New\',monospace',
      'z-index:100000',
      'pointer-events:all',
    ].join(';');

    overlayEl.appendChild(spotlightEl);
    document.body.appendChild(overlayEl);
    document.body.appendChild(cardEl);
  }

  function destroyOverlay() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (cardEl)    { cardEl.remove();    cardEl    = null; }
    spotlightEl = null;
  }

  function buildCSS() {
    if (document.getElementById('tut-style')) return;
    const s = document.createElement('style');
    s.id = 'tut-style';
    s.textContent = `
      @keyframes tut-pulse {
        0%,100% { border-color: rgba(0,212,255,0.9); box-shadow: 0 0 0 9999px rgba(0,0,0,0.82), 0 0 0 4px rgba(0,212,255,0.15); }
        50%      { border-color: rgba(0,212,255,0.4); box-shadow: 0 0 0 9999px rgba(0,0,0,0.82), 0 0 0 8px rgba(0,212,255,0.05); }
      }
      #tut-card * { box-sizing:border-box; }
      .tut-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
    `;
    document.head.appendChild(s);
  }

  // ── RENDER STEP ───────────────────────────────────

  function renderStep(index) {
    const step  = STEPS[index];
    const isLast = (index === STEPS.length - 1);
    const total  = STEPS.length;

    // Spotlight
    const rect = step.targetId ? getScreenRect(step.targetId) : null;
    if (rect && spotlightEl) {
      const pad = 8;
      spotlightEl.style.left   = (rect.left   - pad) + 'px';
      spotlightEl.style.top    = (rect.top    - pad) + 'px';
      spotlightEl.style.width  = (rect.width  + pad * 2) + 'px';
      spotlightEl.style.height = (rect.height + pad * 2) + 'px';
      spotlightEl.style.display = 'block';
    } else if (spotlightEl) {
      // No target — hide dimmer so full screen is readable
      spotlightEl.style.display = 'none';
      // But still dim via overlay background
      if (overlayEl) overlayEl.style.background = 'rgba(0,0,0,0.72)';
    }
    if (rect && overlayEl) overlayEl.style.background = 'transparent';

    // Step indicator dots
    const dots = Array.from({ length: total }, (_, i) => {
      let color, char;
      if (i < index)       { color = '#00d4ff44'; char = '●'; }
      else if (i === index){ color = '#00d4ff';   char = '◉'; }
      else                 { color = '#333';       char = '○'; }
      return `<span class="tut-dot" style="color:${color};font-size:10px;margin:0 3px;">${char}</span>`;
    }).join('');

    // Title & text
    const title = T(step.titleKey);
    const text  = T(step.textKey);

    // Buttons
    const nextLabel = isLast ? T('tutorial.btn.start') : T('tutorial.btn.next');
    const skipBtn   = !isLast
      ? `<button id="tut-skip" style="
          background:transparent;border:none;cursor:pointer;
          color:rgba(255,255,255,0.25);font-family:inherit;font-size:7px;
          letter-spacing:1px;padding:0;">
          ${T('tutorial.btn.skip')}
        </button>`
      : '<span></span>';

    cardEl.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;letter-spacing:2px;">${dots}</div>

      <div style="font-size:11px;color:#00d4ff;letter-spacing:1.5px;margin-bottom:14px;line-height:1.4;">
        ${title}
      </div>

      <div style="font-size:11px;color:#c2c0b6;line-height:1.7;white-space:pre-line;margin-bottom:24px;
                  font-family:'Courier New',monospace;letter-spacing:0.5px;">
        ${text}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;">
        ${skipBtn}
        <button id="tut-next" style="
          background:rgba(0,255,136,0.12);border:1px solid rgba(0,255,136,0.4);
          color:#00ff88;font-family:inherit;font-size:8px;letter-spacing:1px;
          padding:9px 20px;cursor:pointer;transition:background 0.2s;">
          ${nextLabel}
        </button>
      </div>
    `;

    // Wire buttons
    const nextBtn = document.getElementById('tut-next');
    if (nextBtn) {
      nextBtn.addEventListener('mouseover', () => { nextBtn.style.background = 'rgba(0,255,136,0.22)'; });
      nextBtn.addEventListener('mouseout',  () => { nextBtn.style.background = 'rgba(0,255,136,0.12)'; });
      nextBtn.addEventListener('click', advance);
    }
    const skipBtnEl = document.getElementById('tut-skip');
    if (skipBtnEl) {
      skipBtnEl.addEventListener('click', endTutorial);
    }
  }

  // ── FLOW ──────────────────────────────────────────

  function advance() {
    currentStep++;
    if (currentStep >= STEPS.length) {
      endTutorial();
    } else {
      renderStep(currentStep);
    }
  }

  function endTutorial() {
    destroyOverlay();
    markComplete();
    if (doneCallback) {
      const cb  = doneCallback;
      doneCallback = null;
      cb();
    }
  }

  function startTutorial(callback) {
    doneCallback  = callback;
    currentStep   = 0;
    buildCSS();
    buildOverlay();
    renderStep(0);
  }

  // ── PUBLIC API ────────────────────────────────────

  window.runTutorialIfNeeded = function (callback) {
    if (isComplete()) { callback(); return; }
    startTutorial(callback);
  };

  window.resetTutorial = function () {
    localStorage.removeItem(STORAGE_KEY);
  };

})();
