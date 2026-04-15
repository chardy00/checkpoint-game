/* ════════════════════════════════════════════════════
   TUTORIAL SYSTEM — first-time Day 1 walkthrough
   Stored in localStorage['chk_tutorial_done']
════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'chk_tutorial_done';

  // Tutorial steps: { targetId, text, position }
  // position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  const STEPS = [
    {
      targetId: 'doc-content',
      text: 'Yolcunun pasaportu burada görünür. Sekmeleri kullanarak tüm belgeler arasında geçiş yapabilirsiniz.',
      position: 'right'
    },
    {
      targetId: 'right-panel',
      text: 'Sağ panelde biyometrik taramalar ve veritabanı kontrolleri çalışır. Yeşil ışıklar temizi, kırmızı ışıklar sorunu gösterir.',
      position: 'left'
    },
    {
      targetId: 'queue-panel',
      text: 'Bekleyen yolcular kuyruğu. Her yolcunun işlenmesi için sınırlı süreniz var.',
      position: 'right'
    },
    {
      targetId: 'btn-approve',
      text: 'Belgeler kurallara uygunsa ONAYLA butonuna basın.',
      position: 'top'
    },
    {
      targetId: 'btn-deny',
      text: 'Hatalı veya eksik belge varsa REDDET butonuna basın.',
      position: 'top'
    },
    {
      targetId: 'btn-detain',
      text: 'Şüpheli kişileri gözaltına almak için GÖZ ALTI butonunu kullanın.',
      position: 'top'
    },
    {
      targetId: 'moral-panel',
      text: 'Ahlaki değerleriniz her kararda değişir. Sadakat ve yolsuzluk dengesi sonucu belirler.',
      position: 'top'
    }
  ];

  let currentStep = 0;
  let doneCallback = null;

  function isComplete() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  function markComplete() {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function getRect(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    // Convert from screen coords to game coords (inside scaled #app)
    const app = document.getElementById('app');
    const wrap = document.getElementById('game-wrap');
    if (!app || !wrap) return r;
    const scale = Math.min(wrap.clientWidth / 1280, wrap.clientHeight / 720);
    const appRect = app.getBoundingClientRect();
    return {
      left:   (r.left   - appRect.left) / scale,
      top:    (r.top    - appRect.top)  / scale,
      width:  r.width  / scale,
      height: r.height / scale,
      right:  (r.right  - appRect.left) / scale,
      bottom: (r.bottom - appRect.top)  / scale,
    };
  }

  function showStep(index) {
    const overlay   = document.getElementById('tutorial-overlay');
    const spotlight = document.getElementById('tutorial-spotlight');
    const tooltip   = document.getElementById('tutorial-tooltip');
    const textEl    = document.getElementById('tutorial-text');
    if (!overlay || !spotlight || !tooltip || !textEl) return;

    if (index >= STEPS.length) {
      endTutorial();
      return;
    }

    const step = STEPS[index];
    const rect = getRect(step.targetId);

    overlay.style.display = 'block';

    // Spotlight cutout via box-shadow
    if (rect) {
      const pad = 6;
      spotlight.style.cssText = `
        position:absolute;
        left:${rect.left - pad}px;
        top:${rect.top - pad}px;
        width:${rect.width + pad*2}px;
        height:${rect.height + pad*2}px;
        box-shadow: 0 0 0 2000px rgba(0,0,0,0.75);
        border-radius:3px;
        pointer-events:none;
        transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease;
      `;
    } else {
      spotlight.style.cssText = 'display:none;';
    }

    // Tooltip text
    const stepNum = `<span style="color:rgba(0,212,255,0.5);font-size:9px;">${index+1}/${STEPS.length}</span><br>`;
    textEl.innerHTML = stepNum + step.text;

    // Position tooltip near target
    if (rect) {
      const ttW = 260, ttH = 120;
      let ttLeft = rect.left, ttTop = rect.bottom + 12;

      if (step.position === 'top')    { ttTop  = rect.top - ttH - 12; ttLeft = rect.left + rect.width/2 - ttW/2; }
      if (step.position === 'bottom') { ttTop  = rect.bottom + 12;    ttLeft = rect.left + rect.width/2 - ttW/2; }
      if (step.position === 'left')   { ttLeft = rect.left - ttW - 12; ttTop = rect.top + rect.height/2 - ttH/2; }
      if (step.position === 'right')  { ttLeft = rect.right + 12;      ttTop = rect.top + rect.height/2 - ttH/2; }
      if (step.position === 'center') { ttLeft = 1280/2 - ttW/2;      ttTop = 720/2 - ttH/2; }

      // Clamp inside game stage
      ttLeft = Math.max(8, Math.min(ttLeft, 1280 - ttW - 8));
      ttTop  = Math.max(8, Math.min(ttTop,  720  - ttH - 8));

      tooltip.style.left = ttLeft + 'px';
      tooltip.style.top  = ttTop  + 'px';
    } else {
      tooltip.style.left = '50%';
      tooltip.style.top  = '50%';
      tooltip.style.transform = 'translate(-50%,-50%)';
    }
  }

  function nextStep() {
    currentStep++;
    if (currentStep >= STEPS.length) {
      endTutorial();
    } else {
      showStep(currentStep);
    }
  }

  function endTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
    markComplete();
    if (doneCallback) {
      const cb = doneCallback;
      doneCallback = null;
      cb();
    }
  }

  function startTutorial(callback) {
    doneCallback = callback;
    currentStep = 0;

    // Wire up buttons
    const nextBtn = document.getElementById('tutorial-next');
    const skipBtn = document.getElementById('tutorial-skip');

    if (nextBtn) {
      nextBtn.onclick = nextStep;
    }
    if (skipBtn) {
      skipBtn.onclick = endTutorial;
    }

    showStep(0);
  }

  // Public API
  window.runTutorialIfNeeded = function(callback) {
    if (isComplete()) {
      callback();
      return;
    }
    startTutorial(callback);
  };

  window.resetTutorial = function() {
    localStorage.removeItem(STORAGE_KEY);
  };

})();
