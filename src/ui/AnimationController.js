/* ================================================================
   CHECKPOINT — AnimationController
   DOM-only module. All animation triggers + audio system.

   Extracted from ui.js: triggerBioScanLine, triggerAlertFlash,
   triggerPassengerWalkIn, triggerDocSlide, triggerMoneyTick,
   triggerGlitch, triggerNameGlitch, showAnimusSymbol, plus
   the full Web Audio synthesis layer.

   Exports:
     setVolume(pct)
     soundApprove / soundDeny / soundAlert / soundScanner / soundPhantom
     triggerBioScanLine / triggerAlertFlash
     triggerPassengerWalkIn / triggerDocSlide / triggerMoneyTick
     triggerGlitch / triggerNameGlitch / showAnimusSymbol
     install()
================================================================ */

// ── AUDIO SYSTEM ─────────────────────────────────────────────

let _actx   = null;
let _volume = 0.8;

try {
  const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
  if (s.volume != null) _volume = s.volume / 100;
} catch (_) {}

function _ctx() {
  if (typeof window === 'undefined') return null;
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function _tone(freq, type, dur, vol = 0.35, delay = 0) {
  try {
    const c = _ctx(); if (!c) return;
    const osc = c.createOscillator(), env = c.createGain();
    osc.connect(env); env.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    env.gain.setValueAtTime(0, c.currentTime + delay);
    env.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + dur + 0.05);
  } catch (_) {}
}

function _rising(f0, f1, dur, vol = 0.2) {
  try {
    const c = _ctx(); if (!c) return;
    const osc = c.createOscillator(), env = c.createGain();
    osc.connect(env); env.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, c.currentTime);
    osc.frequency.linearRampToValueAtTime(f1, c.currentTime + dur);
    env.gain.setValueAtTime(vol, c.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.05);
  } catch (_) {}
}

export function setVolume(pct) {
  _volume = Math.max(0, Math.min(100, +pct)) / 100;
}

export function soundApprove()  { _tone(80,  'sine',     0.10, 0.5  * _volume); }
export function soundDeny()     { _tone(200, 'sawtooth', 0.15, 0.4  * _volume); }
export function soundAlert() {
  _tone(880, 'square', 0.08, 0.3 * _volume, 0);
  _tone(880, 'square', 0.08, 0.3 * _volume, 0.13);
  _tone(880, 'square', 0.08, 0.3 * _volume, 0.26);
}
export function soundScanner()  { _rising(300, 600, 2.5, 0.18 * _volume); }
export function soundPhantom()  { _tone(55,  'sine',     0.30, 0.5  * _volume); }

// ── CSS-CLASS ANIMATIONS ──────────────────────────────────────

export function triggerBioScanLine() {
  if (typeof document === 'undefined') return;
  const photo = document.getElementById('passenger-photo');
  if (!photo) return;
  const line = document.createElement('div');
  line.className = 'bio-scan-line';
  photo.appendChild(line);
  setTimeout(() => line.remove(), 700);
}

export function triggerAlertFlash() {
  if (typeof document === 'undefined') return;
  const panel = document.getElementById('right-panel');
  if (!panel) return;
  panel.classList.remove('alert-flash');
  void panel.offsetWidth;
  panel.classList.add('alert-flash');
  setTimeout(() => panel.classList.remove('alert-flash'), 1200);
}

export function triggerPassengerWalkIn() {
  if (typeof document === 'undefined') return;
  const photo = document.getElementById('passenger-photo');
  if (!photo) return;
  photo.classList.remove('walk-in');
  void photo.offsetWidth;
  photo.classList.add('walk-in');
}

export function triggerDocSlide() {
  if (typeof document === 'undefined') return;
  const wrap = document.getElementById('doc-content-wrap');
  if (!wrap) return;
  wrap.classList.remove('doc-slide');
  void wrap.offsetWidth;
  wrap.classList.add('doc-slide');
}

export function triggerMoneyTick() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('stat-money');
  if (!el) return;
  el.classList.remove('money-tick');
  void el.offsetWidth;
  el.classList.add('money-tick');
}

// ── ANIMUS GLITCH EFFECTS ─────────────────────────────────────

export function triggerGlitch() {
  if (typeof document === 'undefined') return;
  const pairs = [
    ['btn-approve', 'KAÇIN'],
    ['btn-deny',    'GEÇİR'],
    ['stat-money',  '???'],
  ];
  const [id, text] = pairs[Math.floor(Math.random() * pairs.length)];
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.querySelector?.('.btn-label') || el;
  const orig   = target.textContent;
  target.textContent = text;
  target.style.color = '#40ff80';
  setTimeout(() => { target.textContent = orig; target.style.color = ''; }, 1800);
}

export function triggerNameGlitch() {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('passenger-name');
  if (!el || !el.textContent.trim()) return;
  const orig = el.textContent;
  el.textContent = 'SEN';
  el.style.color = '#40ff80';
  setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1000);
}

export function showAnimusSymbol() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('animus-corner')) return;
  const sym = document.createElement('div');
  sym.id = 'animus-corner';
  sym.textContent = '◈';
  sym.style.cssText = [
    'position:absolute', 'bottom:18px', 'right:22px',
    'font-size:18px', 'color:rgba(80,255,80,0.18)',
    'z-index:9950', 'pointer-events:none',
    'animation:animus-fade 4s ease-out forwards',
  ].join(';');
  const app = document.getElementById('app');
  if (app) { app.appendChild(sym); setTimeout(() => sym.remove(), 4000); }
}

// ── ENHANCED INTERACTIONS ─────────────────────────────────────

/**
 * Ripple effect on a button element at click coordinates.
 * @param {MouseEvent} event
 */
export function triggerButtonRipple(event) {
  if (typeof document === 'undefined') return;
  const btn = event.currentTarget;
  if (!btn) return;
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = [
    `width:${size}px`, `height:${size}px`,
    `left:${event.clientX - rect.left - size / 2}px`,
    `top:${event.clientY - rect.top - size / 2}px`,
  ].join(';');
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
}

/**
 * Apply correct/wrong decision feedback class to a target element.
 * @param {HTMLElement|string} target  — element or element id
 * @param {boolean}            correct
 */
export function triggerDecisionFeedback(target, correct) {
  if (typeof document === 'undefined') return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  const cls = correct ? 'decision-correct' : 'decision-wrong';
  el.classList.remove('decision-correct', 'decision-wrong');
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/**
 * Attach ripple listeners to all action buttons.
 * Safe to call multiple times — uses data attribute to guard.
 */
export function attachButtonRipples() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.action-btn').forEach(btn => {
    if (btn.dataset.rippleAttached) return;
    btn.dataset.rippleAttached = '1';
    btn.addEventListener('click', triggerButtonRipple);
  });
}

/**
 * Add idle breathing animation to passenger photo.
 */
export function startPhotoIdle() {
  if (typeof document === 'undefined') return;
  const photo = document.getElementById('passenger-photo');
  if (photo) photo.classList.add('idle');
}

export function stopPhotoIdle() {
  if (typeof document === 'undefined') return;
  const photo = document.getElementById('passenger-photo');
  if (photo) photo.classList.remove('idle');
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

export function install() {
  if (typeof window === 'undefined') return;
  window.setVolume              = setVolume;
  window.soundApprove           = soundApprove;
  window.soundDeny              = soundDeny;
  window.soundAlert             = soundAlert;
  window.soundScanner           = soundScanner;
  window.soundPhantom           = soundPhantom;
  window.triggerBioScanLine     = triggerBioScanLine;
  window.triggerAlertFlash      = triggerAlertFlash;
  window.triggerPassengerWalkIn = triggerPassengerWalkIn;
  window.triggerDocSlide        = triggerDocSlide;
  window.triggerMoneyTick       = triggerMoneyTick;
  window.triggerGlitch          = triggerGlitch;
  window.triggerNameGlitch      = triggerNameGlitch;
  window.showAnimusSymbol       = showAnimusSymbol;
  window.triggerButtonRipple    = triggerButtonRipple;
  window.triggerDecisionFeedback = triggerDecisionFeedback;
  window.attachButtonRipples    = attachButtonRipples;
  window.startPhotoIdle         = startPhotoIdle;
  window.stopPhotoIdle          = stopPhotoIdle;

  // Attach ripples after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachButtonRipples);
  } else {
    attachButtonRipples();
  }

  console.log('[AnimationController] Installed.');
}
