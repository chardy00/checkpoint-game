/* ============================================================
   CHECKPOINT — Settings, Portrait & Language Wiring
   Loads last (after ui.js). Accesses window.t, window.GameState
   ============================================================ */
'use strict';

// ─────────────────────────────────────────────────────────────
// 1. SETTINGS: LOAD AND APPLY ON STARTUP
// ─────────────────────────────────────────────────────────────
(function applySettingsOnLoad() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem('chk_settings') || '{}'); } catch (e) {}

  // Visual quality
  const q = s.quality || 'medium';
  document.body.classList.remove('quality-low', 'quality-medium', 'quality-high');
  document.body.classList.add('quality-' + q);

  // CRT overlay
  document.body.classList.toggle('crt-on', !!s.crt);

  // Font size
  const fs = s.fontSize || 'medium';
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add('font-' + fs);

  // Volume — ui.js already reads it on its own load; we honour the same key
  // Language — lang.js already reads and applies it before this script runs
})();

// ─────────────────────────────────────────────────────────────
// PERSIST HELPER
// ─────────────────────────────────────────────────────────────
function _saveSetting(key, value) {
  try {
    const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
    s[key] = value;
    localStorage.setItem('chk_settings', JSON.stringify(s));
  } catch (e) {}
}

function _getSetting(key, def) {
  try {
    const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
    return (s[key] !== undefined) ? s[key] : def;
  } catch (e) { return def; }
}

// ─────────────────────────────────────────────────────────────
// 2. LIVE-SETTING CALLBACKS  (called from modal onclick)
// ─────────────────────────────────────────────────────────────

window._setLang = function (lc) {
  if (window.setLanguage) window.setLanguage(lc);  // lang.js handles persist
  // Refresh active state in the open modal
  document.querySelectorAll('.s-lang-btn').forEach(function (b) {
    _sActivate(b, b.dataset.lang === lc);
  });
  // Refresh the settings modal title (language may have changed)
  const titleEl = document.getElementById('modal-title');
  if (titleEl) titleEl.textContent = window.t('settings.title');
};

window._setVol = function (v) {
  const vol = Math.max(0, Math.min(100, +v));
  _saveSetting('volume', vol);
  if (window.setVolume) window.setVolume(vol);  // ui.js live update
  const lbl = document.getElementById('s-vol-val');
  if (lbl) lbl.textContent = vol;
};

window._setQuality = function (q) {
  document.body.classList.remove('quality-low', 'quality-medium', 'quality-high');
  document.body.classList.add('quality-' + q);
  _saveSetting('quality', q);
  document.querySelectorAll('.s-qual-btn').forEach(function (b) {
    _sActivate(b, b.dataset.q === q);
  });
};

window._setCRT = function (on) {
  document.body.classList.toggle('crt-on', on);
  _saveSetting('crt', on);
  document.querySelectorAll('.s-crt-btn').forEach(function (b) {
    _sActivate(b, b.dataset.crt === String(on));
  });
};

window._setFullscreen = function () {
  if (window.electronAPI && window.electronAPI.fullscreen) {
    window.electronAPI.fullscreen();
  } else if (document.documentElement.requestFullscreen) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen().catch(function () {});
    }
  }
};

window._resetGame = function () {
  const T = window.t || function (k) { return k; };
  if (!confirm('Reset all save progress? This cannot be undone.')) return;
  try { localStorage.removeItem('chk_save'); } catch (e) {}
  location.reload();
};

window._closeSettings = function () {
  const ov = document.getElementById('modal-overlay');
  if (ov) ov.classList.remove('show');
};

// Toggle active style on a settings button
function _sActivate(btn, active) {
  if (active) {
    btn.style.background    = 'rgba(200,160,96,0.22)';
    btn.style.color         = '#c8a060';
    btn.style.borderColor   = 'rgba(200,160,96,0.65)';
  } else {
    btn.style.background    = 'rgba(0,0,0,0.35)';
    btn.style.color         = '#6b4020';
    btn.style.borderColor   = 'rgba(180,100,40,0.35)';
  }
}

// ─────────────────────────────────────────────────────────────
// 3. SETTINGS MODAL
// ─────────────────────────────────────────────────────────────
window.showSettingsModal = function () {
  const T    = window.t || function (k) { return k; };
  const lang = _getSetting('language', 'en');
  const vol  = _getSetting('volume',   80);
  const qual = _getSetting('quality',  'medium');
  const crt  = _getSetting('crt',      false);

  // Shared button style
  const BTN = [
    'font-family:\'Press Start 2P\',monospace',
    'font-size:7px',
    'letter-spacing:1px',
    'padding:7px 14px',
    'border:1px solid rgba(180,100,40,0.35)',
    'background:rgba(0,0,0,0.35)',
    'color:#6b4020',
    'cursor:pointer',
    'text-transform:uppercase',
    'transition:background 0.15s,color 0.15s',
  ].join(';');
  const BTN_ACT = [
    'background:rgba(200,160,96,0.22)',
    'color:#c8a060',
    'border-color:rgba(200,160,96,0.65)',
  ].join(';');

  function btn(label, onclick, extraStyle, active) {
    const style = BTN + ';' + (extraStyle || '') + (active ? ';' + BTN_ACT : '');
    return '<button style="' + style + '" onclick="' + onclick + '">' + label + '</button>';
  }

  // Section label
  const LBL = 'display:block;font-family:\'Press Start 2P\',monospace;font-size:6px;' +
              'color:#5a3820;letter-spacing:1.5px;margin-bottom:8px;text-transform:uppercase;';
  const ROW = 'margin-bottom:18px;';
  const GRP = 'display:flex;gap:7px;flex-wrap:wrap;align-items:center;';
  const DIV = 'border-top:1px solid rgba(180,100,40,0.18);margin:4px 0 16px;';

  const body = `
<div style="font-family:'Courier Prime',monospace;color:#c8d0dc;font-size:13px;line-height:1.6">

  <!-- LANGUAGE -->
  <div style="${ROW}">
    <span style="${LBL}">${T('settings.language')}</span>
    <div style="${GRP}">
      <button class="s-lang-btn" data-lang="en"
        style="${BTN}${lang === 'en' ? ';' + BTN_ACT : ''}"
        onclick="window._setLang('en')">English</button>
      <button class="s-lang-btn" data-lang="tr"
        style="${BTN}${lang === 'tr' ? ';' + BTN_ACT : ''}"
        onclick="window._setLang('tr')">Türkçe</button>
    </div>
  </div>

  <!-- VOLUME -->
  <div style="${ROW}">
    <span style="${LBL}">${T('settings.volume')} — <span id="s-vol-val">${vol}</span>%</span>
    <input type="range" id="s-volume" min="0" max="100" value="${vol}"
      oninput="window._setVol(this.value)"
      style="width:100%;cursor:pointer;accent-color:#c8a060;height:3px;margin-top:2px;">
  </div>

  <!-- VISUAL QUALITY -->
  <div style="${ROW}">
    <span style="${LBL}">${T('settings.quality')}</span>
    <div style="${GRP}">
      <button class="s-qual-btn" data-q="low"
        style="${BTN}${qual === 'low' ? ';' + BTN_ACT : ''}"
        onclick="window._setQuality('low')">${T('settings.qualityLow')}</button>
      <button class="s-qual-btn" data-q="medium"
        style="${BTN}${qual === 'medium' ? ';' + BTN_ACT : ''}"
        onclick="window._setQuality('medium')">${T('settings.qualityMed')}</button>
      <button class="s-qual-btn" data-q="high"
        style="${BTN}${qual === 'high' ? ';' + BTN_ACT : ''}"
        onclick="window._setQuality('high')">${T('settings.qualityHigh')}</button>
    </div>
  </div>

  <!-- CRT EFFECT -->
  <div style="${ROW}">
    <span style="${LBL}">${T('settings.crt')}</span>
    <div style="${GRP}">
      <button class="s-crt-btn" data-crt="false"
        style="${BTN}${!crt ? ';' + BTN_ACT : ''}"
        onclick="window._setCRT(false)">${T('settings.crtOff')}</button>
      <button class="s-crt-btn" data-crt="true"
        style="${BTN}${crt ? ';' + BTN_ACT : ''}"
        onclick="window._setCRT(true)">${T('settings.crtOn')}</button>
    </div>
  </div>

  <!-- FULLSCREEN -->
  <div style="${ROW}">
    <span style="${LBL}">FULLSCREEN</span>
    <div style="${GRP}">
      <button style="${BTN}" onclick="window._setFullscreen()">&#9645; Toggle Fullscreen</button>
    </div>
  </div>

  <!-- DIVIDER + FOOTER -->
  <div style="${DIV}"></div>
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
    <button style="${BTN};background:rgba(255,51,85,0.08);color:#c04050;border-color:rgba(255,51,85,0.3)"
      onclick="window._resetGame()">&#9888; Reset Save</button>
    <button style="${BTN}" onclick="window._closeSettings()">${T('settings.close')}</button>
  </div>

</div>`;

  // Inject into existing modal infrastructure
  const overlay  = document.getElementById('modal-overlay');
  const titleEl  = document.getElementById('modal-title');
  const bodyEl   = document.getElementById('modal-body');
  const actionsEl= document.getElementById('modal-actions');

  if (!overlay) return;

  titleEl.textContent  = T('settings.title');
  bodyEl.innerHTML     = body;
  actionsEl.innerHTML  = '';
  overlay.classList.add('show');
};

// ─────────────────────────────────────────────────────────────
// 4. PIXEL-ART PORTRAIT GENERATOR
// ─────────────────────────────────────────────────────────────

// Skin tones indexed by nation
const _SKIN = {
  'Arstotzka':         '#e8c898',
  'Kolechia':          '#d4a868',
  'Impor':             '#9a6a38',
  'Antegria':          '#c8a060',
  'Republia':          '#c09060',
  'United Federation': '#e0b880',
  'Obristan':          '#9a6830',
  'Unitas':            '#c8a060',
};

// Clothing colour indexed by nation
const _CLOTH = {
  'Arstotzka':         '#2a3a5a',
  'Kolechia':          '#3a4a28',
  'Impor':             '#4a2828',
  'Antegria':          '#1e2a48',
  'Republia':          '#3a3030',
  'United Federation': '#4a3c2a',
  'Obristan':          '#283828',
  'Unitas':            '#3a2a3a',
};

// Hair colour palette (index chosen from passenger id)
const _HAIR = [
  '#0f0a05',  // black
  '#2a1808',  // near-black brown
  '#5a3010',  // chestnut
  '#8b5020',  // medium brown
  '#c8a030',  // blonde
  '#604040',  // dark grey
  '#c07030',  // auburn
  '#4a4440',  // steel grey
];

// 0=short  1=long  2=bald  3=hat  (cycled by passenger id)
const _STYLES = ['short', 'long', 'short', 'bald', 'short', 'hat', 'short', 'long'];

// Lighten/darken a hex colour
function _shade(hex, amt) {
  let r = parseInt(hex.slice(1, 3), 16) + amt;
  let g = parseInt(hex.slice(3, 5), 16) + amt;
  let b = parseInt(hex.slice(5, 7), 16) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
}

/**
 * Draw a pixel-art portrait onto #portrait-canvas for the given passenger.
 * Canvas is 76×96px.  Pixel grid: 19 wide × 24 tall  (P = 4 px per block).
 */
function drawPassengerPortrait(passenger) {
  const canvas = document.getElementById('portrait-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const P  = 4;     // real pixels per grid block
  const GW = 19;    // grid columns
  const GH = 24;    // grid rows

  // Helper: draw one grid block
  function px(c, r, color) {
    if (c < 0 || r < 0 || c >= GW || r >= GH) return;
    ctx.fillStyle = color;
    ctx.fillRect(c * P, r * P, P, P);
  }
  // Helper: fill a horizontal span on row r
  function hspan(c0, c1, r, color) {
    for (var c = c0; c <= c1; c++) px(c, r, color);
  }
  // Helper: fill a vertical span on column c
  function vspan(c, r0, r1, color) {
    for (var r = r0; r <= r1; r++) px(c, r, color);
  }

  // ── Resolve passenger colours ───────────────────────────
  const nation  = passenger.nation || '';
  const skin    = _SKIN[nation]  || '#d0a870';
  const cloth   = _CLOTH[nation] || '#2a3030';
  const seed    = Math.abs(passenger.id || 1);
  const hair    = _HAIR[seed % _HAIR.length];
  const style   = _STYLES[seed % _STYLES.length];
  const shadow  = _shade(skin, -32);
  const hilit   = _shade(cloth, 28);
  const darker  = _shade(cloth, -18);
  const bg      = '#0e0e16';

  // Expression based on anomaly data
  const anomalies   = passenger.anomalies || [];
  const isWatchlist = anomalies.some(function (a) { return a.type === 'watchlist_hit'; });
  const hasAnomaly  = anomalies.length > 0;

  // ── Clear ────────────────────────────────────────────────
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Hair / hat  ──────────────────────────────────────────
  if (style === 'bald') {
    // Smooth top — skin coloured
    hspan(4, 13, 0, _shade(skin, -8));
    hspan(3, 14, 1, _shade(skin, -4));
    hspan(3, 14, 2, skin);
  } else if (style === 'hat') {
    const hatTop  = '#1a1a2a';
    const hatBrim = '#26263a';
    // Crown rows 0–1
    for (var r = 0; r <= 1; r++) hspan(3, 15, r, hatTop);
    // Brim row 2
    hspan(1, 17, 2, hatBrim);
    // Hat sides at row 3-4
    px(2, 3, hatTop); px(2, 4, hatTop);
    px(15, 3, hatTop); px(15, 4, hatTop);
  } else {
    // Short or long
    hspan(3, 14, 0, hair);
    hspan(2, 15, 1, hair);
    hspan(2, 15, 2, hair);
    // Side strands alongside face
    for (var fr = 3; fr <= 8; fr++) {
      px(2, fr, hair); px(3, fr, hair);
      px(14, fr, hair); px(15, fr, hair);
    }
    if (style === 'long') {
      // Hair cascades past neck down to row 16
      for (var lr = 9; lr <= 16; lr++) {
        px(1, lr, hair); px(2, lr, hair);
        px(15, lr, hair); px(16, lr, hair);
      }
    }
  }

  // ── Face (skin) ──────────────────────────────────────────
  for (var rr = 3; rr <= 8; rr++) hspan(4, 13, rr, skin);

  // Cheek shadows
  px(4, 6, shadow); px(13, 6, shadow);
  px(4, 7, shadow); px(13, 7, shadow);

  // ── Eyes ─────────────────────────────────────────────────
  const eyeCol = isWatchlist ? '#3a0808' : '#1a0f20';
  if (isWatchlist) {
    // Narrowed / suspicious slits
    px(5, 5, eyeCol); px(12, 5, eyeCol);
    // Furrowed brow
    px(5, 4, shadow); px(6, 4, shadow);
    px(11, 4, shadow); px(12, 4, shadow);
  } else if (hasAnomaly) {
    // Worried: raised inner corners, slight squint
    px(5, 5, eyeCol); px(6, 5, eyeCol);
    px(11, 5, eyeCol); px(12, 5, eyeCol);
    px(6, 4, shadow); px(11, 4, shadow);  // inner brow dip
  } else {
    // Normal, relaxed
    px(5, 5, eyeCol); px(6, 5, eyeCol);
    px(11, 5, eyeCol); px(12, 5, eyeCol);
  }

  // ── Nose bridge ──────────────────────────────────────────
  px(8, 6, shadow); px(9, 6, shadow);
  px(8, 7, shadow);

  // ── Mouth ────────────────────────────────────────────────
  const lip = _shade(skin, -45);
  if (isWatchlist) {
    // Tense / clenched
    hspan(7, 11, 7, lip);
  } else if (hasAnomaly) {
    // Slight frown
    px(7, 7, lip); px(11, 7, lip);
    hspan(8, 10, 8, lip);
  } else {
    // Neutral (very slight smile)
    hspan(7, 11, 7, lip);
    px(6, 7, lip); px(12, 7, lip);
  }

  // ── Neck ────────────────────────────────────────────────
  hspan(7, 11, 9,  skin);
  hspan(7, 11, 10, skin);

  // ── Body / Clothing ──────────────────────────────────────
  for (var br = 11; br <= 21; br++) {
    var cl = (br === 11) ? 3 : 2;
    var cr = (br === 11) ? 14 : 15;
    hspan(cl, cr, br, cloth);
  }

  // Collar (lighter)
  hspan(7, 11, 11, hilit);
  px(8, 12, hilit); px(10, 12, hilit);

  // Centre button / seam line
  vspan(9, 13, 20, darker);

  // ── National detail ───────────────────────────────────────
  if (nation === 'Arstotzka') {
    // Dark red tie
    var tie = '#8b0000';
    px(9, 11, tie);
    hspan(8, 10, 12, tie);
    px(9, 13, tie); px(9, 14, tie);
    hspan(8, 10, 15, tie);
    px(9, 16, tie);
  } else if (nation === 'Kolechia') {
    // Olive epaulette marks
    px(2, 11, '#6a8040'); px(3, 11, '#6a8040');
    px(14, 11, '#6a8040'); px(15, 11, '#6a8040');
  } else if (nation === 'Impor') {
    // Yellow stripe on right shoulder
    vspan(14, 12, 15, '#c8a000');
  }

  // ── Vignette gradient over canvas ────────────────────────
  var grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height * 0.45, canvas.height * 0.28,
    canvas.width / 2, canvas.height * 0.45, canvas.height * 0.72
  );
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Hide "NO IMG" label once drawn
  var lbl = document.getElementById('photo-overlay-label');
  if (lbl) lbl.style.display = 'none';
}

window.drawPassengerPortrait = drawPassengerPortrait;

// ── Portrait redraw observer ──────────────────────────────────
// Fires whenever ui.js updates #passenger-name (= new passenger loaded)
(function setupPortraitObserver() {
  var nameEl = document.getElementById('passenger-name');
  if (!nameEl) return;

  var observer = new MutationObserver(function () {
    var p = window.GameState && window.GameState.current;
    if (p && p.firstName) {
      // Brief delay — let renderPassengerProfile finish first
      setTimeout(function () { drawPassengerPortrait(p); }, 60);
    }
  });

  observer.observe(nameEl, { childList: true, characterData: true, subtree: true });
})();

// Draw the blank canvas on first load (dark bg + subtle silhouette)
(function drawInitialCanvas() {
  var canvas = document.getElementById('portrait-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0e0e16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ghost silhouette  (minimal pixel-art)
  var ghost = 'rgba(60,70,100,0.18)';
  var P = 4;
  function gpx(c, r) {
    ctx.fillStyle = ghost;
    ctx.fillRect(c * P, r * P, P, P);
  }
  // Head outline
  for (var c = 6; c <= 12; c++) { gpx(c, 3); gpx(c, 8); }
  for (var r = 3; r <= 8; r++)  { gpx(6, r); gpx(12, r); }
  // Body
  for (var br = 11; br <= 21; br++) {
    var cl = 4, cr2 = 14;
    for (var bc = cl; bc <= cr2; bc++) gpx(bc, br);
  }
  // Neck
  for (var nr = 9; nr <= 10; nr++) {
    for (var nc = 8; nc <= 10; nc++) gpx(nc, nr);
  }
})();

console.log('[CHECKPOINT] settings.js loaded.');
