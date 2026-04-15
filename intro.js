/* ════════════════════════════════════════════════════
   INTRO SEQUENCE — 4-screen cinematic on first launch
   Stored in localStorage['chk_intro_done']
════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'chk_intro_done';

  // 4 screens: each has a type and content
  const SCREENS = [
    {
      type: 'newspaper',
      headline: 'SINIR KAPISI YENİDEN AÇILDI',
      subhead:  'Yetkililere Göre Kontrol Artırıldı',
      body:     'Hükümet, sınır kapısını yeniden açtığını ve tüm giriş işlemlerinin\n' +
                'sıkı denetim altına alındığını açıkladı. Yeni prosedürler bugün itibariyle\n' +
                'geçerli olacak.',
      date:     '14 MART 2024',
    },
    {
      type: 'letter',
      from:    'ÇALIŞMA BAKANI',
      to:      'SINIR GÖREVLİSİ',
      body:    'Bugünden itibaren sınır kapısında görevinize başlıyorsunuz.\n\n' +
               'Göreviniz: Her yolcunun belgelerini incelemek, kurallara aykırı\n' +
               'durumları tespit etmek ve karar vermek.\n\n' +
               'Devletin güvenliği sizin elinizdedir.\n\n' +
               'Başarılar dileriz.',
    },
    {
      type: 'map',
      caption: 'SINIR BÖLGESİ — KONTROL NOKTASI ALFA',
    },
    {
      type: 'text',
      lines: [
        'Görevinize hazır mısınız?',
        '',
        'Her karar bir bedel taşır.',
        'Her pasaport bir hikâye anlatır.',
        '',
        'Doğruyu bulmak size kalmış.',
      ],
    },
  ];

  let currentScreen = 0;
  let doneCallback  = null;
  let typewriterTimer = null;

  function isComplete() {
    return !!localStorage.getItem(STORAGE_KEY);
  }

  function markComplete() {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  function buildNewspaper(screen) {
    return `
      <div style="width:520px;background:#f5f0e8;color:#1a1a1a;padding:24px 28px;
        font-family:'Courier New',monospace;box-shadow:4px 4px 0 rgba(0,0,0,0.5);
        border:2px solid #333;">
        <div style="text-align:center;border-bottom:3px double #333;padding-bottom:8px;margin-bottom:12px;">
          <div style="font-size:9px;letter-spacing:3px;color:#555;">${screen.date}</div>
          <div style="font-size:22px;font-weight:bold;letter-spacing:2px;margin:4px 0;">SINIR GAZETESİ</div>
          <div style="font-size:8px;letter-spacing:1px;color:#555;">GÜNLÜK HABER BÜLTENI</div>
        </div>
        <div style="font-size:16px;font-weight:bold;text-align:center;margin-bottom:6px;line-height:1.3;">
          ${screen.headline}
        </div>
        <div style="font-size:10px;text-align:center;color:#555;margin-bottom:12px;font-style:italic;">
          ${screen.subhead}
        </div>
        <div style="font-size:9px;line-height:1.7;column-count:2;column-gap:16px;color:#333;">
          ${screen.body.replace(/\n/g,'<br>')}
        </div>
      </div>`;
  }

  function buildLetter(screen) {
    return `
      <div style="width:460px;background:#f9f6ee;color:#1a1a1a;padding:30px 32px;
        font-family:'Courier New',monospace;box-shadow:4px 4px 0 rgba(0,0,0,0.5);
        border:1px solid #c8b89a;position:relative;">
        <div style="position:absolute;top:0;left:0;right:0;height:6px;
          background:repeating-linear-gradient(90deg,#8b0000 0,#8b0000 10px,transparent 10px,transparent 20px);"></div>
        <div style="margin-top:8px;">
          <div style="font-size:8px;letter-spacing:2px;color:#666;margin-bottom:4px;">GÖNDEREN: ${screen.from}</div>
          <div style="font-size:8px;letter-spacing:2px;color:#666;margin-bottom:16px;">ALICI: ${screen.to}</div>
          <div style="border-top:1px solid #c8b89a;padding-top:16px;">
            <div id="letter-body" style="font-size:10px;line-height:1.9;white-space:pre-line;color:#333;min-height:100px;"></div>
          </div>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;height:6px;
          background:repeating-linear-gradient(90deg,#8b0000 0,#8b0000 10px,transparent 10px,transparent 20px);"></div>
      </div>`;
  }

  function buildMap(screen) {
    return `
      <div style="width:520px;height:300px;background:#1a2634;position:relative;
        border:2px solid #2a4060;box-shadow:4px 4px 0 rgba(0,0,0,0.5);">
        <!-- Grid lines -->
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.15">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0df" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
        <!-- Border line -->
        <div style="position:absolute;top:50%;left:0;right:0;height:2px;
          background:rgba(255,80,80,0.7);box-shadow:0 0 8px rgba(255,80,80,0.5);">
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);
            font-family:'Courier New',monospace;font-size:8px;color:rgba(255,80,80,0.9);
            letter-spacing:2px;white-space:nowrap;">— SINIR —</div>
        </div>
        <!-- Checkpoint marker -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) translateY(-2px);">
          <div style="width:12px;height:12px;background:#0df;border-radius:50%;
            box-shadow:0 0 12px #0df;animation:pulse-map 1.5s ease-in-out infinite;"></div>
        </div>
        <!-- Zone labels -->
        <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);
          font-family:'Courier New',monospace;font-size:9px;color:rgba(0,212,255,0.5);letter-spacing:2px;">
          KUZEY BÖLGESİ
        </div>
        <div style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);
          font-family:'Courier New',monospace;font-size:9px;color:rgba(0,212,255,0.5);letter-spacing:2px;">
          GÜNEY BÖLGESİ
        </div>
        <!-- Caption -->
        <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
          font-family:'Courier New',monospace;font-size:7px;color:rgba(0,212,255,0.4);
          letter-spacing:1px;">${screen.caption}</div>
      </div>`;
  }

  function buildText(screen) {
    return `
      <div style="text-align:center;">
        <div id="intro-typewriter" style="font-family:'Courier New',monospace;font-size:13px;
          color:#ccc;line-height:2;min-height:160px;text-align:left;display:inline-block;
          white-space:pre-line;"></div>
      </div>`;
  }

  function typewriterLines(lines, el, onDone) {
    const fullText = lines.join('\n');
    let i = 0;
    el.textContent = '';
    if (typewriterTimer) clearInterval(typewriterTimer);
    typewriterTimer = setInterval(() => {
      if (i < fullText.length) {
        el.textContent += fullText[i];
        i++;
      } else {
        clearInterval(typewriterTimer);
        typewriterTimer = null;
        if (onDone) onDone();
      }
    }, 38);
  }

  function showScreen(index) {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) { endIntro(); return; }

    if (index >= SCREENS.length) {
      endIntro();
      return;
    }

    const screen = SCREENS[index];
    overlay.style.display = 'flex';
    overlay.innerHTML = '';

    // Container
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:20px;opacity:0;transition:opacity 0.5s ease;';

    let html = '';
    if (screen.type === 'newspaper') html = buildNewspaper(screen);
    else if (screen.type === 'letter') html = buildLetter(screen);
    else if (screen.type === 'map')    html = buildMap(screen);
    else if (screen.type === 'text')   html = buildText(screen);

    // Continue button
    const isLast = (index === SCREENS.length - 1);
    const btnLabel = isLast ? 'BAŞLA' : 'DEVAM';
    const btnHtml = `
      <button id="intro-next-btn" style="margin-top:12px;background:transparent;
        border:1px solid rgba(0,212,255,0.5);color:rgba(0,212,255,0.8);
        font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;
        padding:8px 24px;cursor:pointer;transition:all 0.2s;">
        ${btnLabel} &#9658;
      </button>`;

    // Skip button (not on last screen)
    const skipHtml = !isLast ? `
      <button id="intro-skip-btn" style="position:absolute;bottom:20px;right:20px;
        background:transparent;border:none;color:rgba(255,255,255,0.2);
        font-family:'Courier New',monospace;font-size:8px;letter-spacing:1px;cursor:pointer;">
        ATLA
      </button>` : '';

    wrap.innerHTML = html + btnHtml;
    overlay.innerHTML = skipHtml;
    overlay.appendChild(wrap);

    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { wrap.style.opacity = '1'; });
    });

    // Typewriter for letter body
    if (screen.type === 'letter') {
      setTimeout(() => {
        const bodyEl = document.getElementById('letter-body');
        if (bodyEl) typewriterLines([screen.body], bodyEl, null);
      }, 300);
    }
    // Typewriter for text screen
    if (screen.type === 'text') {
      setTimeout(() => {
        const twEl = document.getElementById('intro-typewriter');
        if (twEl) typewriterLines(screen.lines, twEl, null);
      }, 300);
    }

    // Button listeners
    const nextBtn = document.getElementById('intro-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('mouseover', () => { nextBtn.style.background = 'rgba(0,212,255,0.1)'; });
      nextBtn.addEventListener('mouseout',  () => { nextBtn.style.background = 'transparent'; });
      nextBtn.addEventListener('click', () => {
        if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
        // Fade out then show next
        wrap.style.opacity = '0';
        wrap.style.transition = 'opacity 0.3s ease';
        setTimeout(() => showScreen(index + 1), 320);
      });
    }

    const skipBtn = document.getElementById('intro-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
        endIntro();
      });
    }
  }

  function endIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.4s ease';
      setTimeout(() => { overlay.style.display = 'none'; overlay.style.opacity = '1'; }, 420);
    }
    markComplete();
    if (doneCallback) {
      const cb = doneCallback;
      doneCallback = null;
      cb();
    }
  }

  // Public API
  window.runIntroIfNeeded = function(callback) {
    if (isComplete()) {
      callback();
      return;
    }
    doneCallback = callback;
    showScreen(0);
  };

  window.resetIntro = function() {
    localStorage.removeItem(STORAGE_KEY);
  };

})();
