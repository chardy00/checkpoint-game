/* ================================================================
   CHECKPOINT — ModalManager
   DOM module. All modal / overlay / dialogue rendering.

   Extracted from ui.js: showModal, closeModal, showDayBulletin,
   showDaySummary, showCharacterDialogue, showBribeModal,
   showDayStartEvent, showEnding, showGameOver, showAnimusMessage.

   All methods are stateless and take explicit arguments.
   They read window.t for i18n and window.GameState / window.StoryState
   only when needed (documented inline).

   Exports:
     showModal(title, body, actions)
     closeModal()
     showDayBulletin(day, storyEvent, onDone)
     showAnimusMessage(text, onDone)
     showDayStartEvent(event, onDone)
     showGameOver()
     install()
================================================================ */

// ── DOM HELPERS ───────────────────────────────────────────────

function $(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

function T(key, params) {
  if (typeof window !== 'undefined' && typeof window.t === 'function') return window.t(key, params);
  return key;
}

function bi(val) {
  if (typeof window !== 'undefined' && typeof window.bi === 'function') return window.bi(val);
  if (val && typeof val === 'object') return val.en || '';
  return String(val ?? '');
}

// ── CORE MODAL ────────────────────────────────────────────────

/**
 * Show the shared modal overlay with title, body HTML, and action buttons.
 * @param {string} title   — HTML string
 * @param {string} body    — HTML string
 * @param {{ label:string, action:()=>void, cls?:string }[]} actions
 */
export function showModal(title, body, actions) {
  const overlay = $('modal-overlay');
  const titleEl = $('modal-title');
  const bodyEl  = $('modal-body');
  const actEl   = $('modal-actions');
  if (!overlay || !titleEl || !bodyEl || !actEl) return;

  titleEl.innerHTML  = title;
  bodyEl.innerHTML   = body;
  actEl.innerHTML    = '';

  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className   = 'action-btn ' + (a.cls || 'btn-approve');
    btn.textContent = a.label;
    btn.style.cssText = 'padding:8px 16px;font-size:11px;letter-spacing:1px';
    btn.addEventListener('click', a.action);
    actEl.appendChild(btn);
  });

  overlay.classList.add('show');
}

/**
 * Hide the shared modal overlay.
 */
export function closeModal() {
  const overlay = $('modal-overlay');
  if (overlay) overlay.classList.remove('show');
}

// ── DAY BULLETIN ──────────────────────────────────────────────

/**
 * Show the start-of-shift briefing modal with rule update + story event.
 * After acknowledgement, checks for ANIMUS message before calling onDone.
 *
 * @param {number}   day
 * @param {object}   storyEvent  — { type, content } | null
 * @param {()=>void} onDone
 */
export function showDayBulletin(day, storyEvent, onDone) {
  const rules = (typeof window !== 'undefined' && typeof window.getRulesForDay === 'function')
    ? window.getRulesForDay(day) : null;

  // Terror-level alert bar
  if (storyEvent && storyEvent.type === 'terror_warning') {
    const bar = $('alert-bar');
    if (bar) {
      bar.classList.add('show');
      setTimeout(() => bar.classList.remove('show'), 8000);
    }
  }

  const ruleBlock = rules ? `
    <div style="background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.18);padding:12px 14px;margin-bottom:14px">
      <div style="font-size:9px;letter-spacing:2px;color:var(--accent);margin-bottom:7px">${T('modal.update', { day })}</div>
      <div style="color:var(--text-bright);font-size:12px;line-height:1.9">${bi(rules.label)}</div>
      ${rules.bannedNations ? `<div style="margin-top:6px;color:var(--red);font-size:11px">${T('modal.bannedEntry', { nations: rules.bannedNations.join(', ') })}</div>` : ''}
      ${rules.terrorLevel   ? `<div style="margin-top:6px;color:var(--red);font-size:11px">${T('modal.threatElev')}</div>` : ''}
      ${rules.interpol === 'detain' ? `<div style="margin-top:6px;color:var(--orange);font-size:11px">${T('modal.interpolDetain')}</div>` : ''}
      ${rules.overstayDetain ? `<div style="margin-top:6px;color:var(--orange);font-size:11px">${T('modal.overstayDetain')}</div>` : ''}
    </div>` : '';

  const typeColors = {
    bulletin: 'var(--accent)', news: 'var(--text-bright)',
    terror_warning: 'var(--red)', phantom_message: '#c0a0ff', consequence: 'var(--yellow)',
  };

  const eventBlock = storyEvent ? `
    <div style="border-left:3px solid ${typeColors[storyEvent.type] || 'var(--yellow)'};
                padding:10px 14px;background:rgba(255,255,255,0.02);margin-bottom:10px">
      <div style="font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-bottom:5px">
        ${storyEvent.type === 'phantom_message' ? '&#9649; ' : ''}${T('event.' + storyEvent.type) || storyEvent.type.replace(/_/g, ' ').toUpperCase()}
      </div>
      <div style="font-size:12px;line-height:1.9;color:var(--text)">${bi(storyEvent.content ?? storyEvent.content_en ?? '')}</div>
    </div>` : '';

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px">
    <div style="text-align:center;padding-bottom:14px;margin-bottom:16px;border-bottom:1px solid var(--border)">
      <div style="font-size:9px;letter-spacing:3px;color:var(--text-dim)">${T('modal.ministry')}</div>
      <div style="font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-top:3px">${T('modal.ops')}</div>
    </div>
    ${ruleBlock}
    ${eventBlock}
    <div style="font-size:9px;color:var(--text-dim);letter-spacing:1px;text-align:right;margin-top:10px">
      ${T('modal.comply')}
    </div>
  </div>`;

  showModal(T('modal.ministry'), body, [{
    label:  T('modal.ack'),
    action: () => {
      closeModal();
      const animusMsg = (typeof window !== 'undefined' && typeof window.getAnimusDayMessage === 'function')
        ? window.getAnimusDayMessage(day) : null;
      if (animusMsg) {
        showAnimusMessage(animusMsg.text, onDone);
      } else {
        onDone();
      }
    },
  }]);
}

// ── ANIMUS MESSAGE ────────────────────────────────────────────

/**
 * Show a full-screen ANIMUS message overlay with typewriter effect.
 * @param {string}   text
 * @param {()=>void} onDone
 */
export function showAnimusMessage(text, onDone) {
  if (typeof document === 'undefined') { onDone?.(); return; }

  const overlay = document.createElement('div');
  overlay.id = 'animus-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.97)',
    'z-index:9999', 'display:flex', 'align-items:center', 'justify-content:center',
    'cursor:pointer', 'padding:40px',
  ].join(';');

  const box = document.createElement('div');
  box.style.cssText = [
    'max-width:520px', 'font-family:var(--font-mono,monospace)',
    'font-size:13px', 'line-height:2', 'color:#40ff80',
    'white-space:pre-wrap', 'letter-spacing:0.5px',
  ].join(';');

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Typewriter
  let i = 0;
  const interval = setInterval(() => {
    box.textContent = text.slice(0, i++);
    if (i > text.length) clearInterval(interval);
  }, 28);

  overlay.addEventListener('click', () => {
    clearInterval(interval);
    overlay.remove();
    onDone?.();
  }, { once: true });
}

// ── DAY START EVENT ───────────────────────────────────────────

/**
 * Show a day-start story event overlay (terror warning, etc).
 * @param {{ type: string, title?: string, body?: string }} event
 * @param {()=>void} onDone
 */
export function showDayStartEvent(event, onDone) {
  if (!event) { onDone?.(); return; }

  const colors = {
    terror_warning:     'var(--red)',
    animus_first_contact: '#40ff80',
    diplomatic_summit:  'var(--accent)',
    default:            'var(--yellow)',
  };
  const color = colors[event.type] || colors.default;

  const body = `
    <div style="font-family:var(--font-mono);padding:10px 0">
      <div style="color:${color};font-size:11px;letter-spacing:2px;margin-bottom:12px">
        ${T('event.' + event.type) || event.type.replace(/_/g, ' ').toUpperCase()}
      </div>
      <div style="font-size:12px;line-height:1.9;color:var(--text)">
        ${bi(event.body ?? event.content ?? '')}
      </div>
    </div>`;

  showModal(bi(event.title ?? { en: 'NOTICE', tr: 'BİLDİRİ' }), body, [{
    label:  T('modal.ack'),
    action: () => { closeModal(); onDone?.(); },
  }]);
}

// ── GAME OVER ─────────────────────────────────────────────────

/**
 * Show a minimal game-over screen.
 */
export function showGameOver() {
  if (typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:#000',
    'display:flex', 'align-items:center', 'justify-content:center',
    'z-index:10000', 'font-family:var(--font-mono,monospace)',
  ].join(';');
  overlay.innerHTML = `
    <div style="text-align:center;color:#fff">
      <div style="font-size:28px;letter-spacing:6px;color:var(--red,#f44)">${T('gameover.title')}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:12px;letter-spacing:2px">${T('gameover.sub')}</div>
      <button onclick="location.reload()"
        style="margin-top:28px;padding:10px 24px;background:transparent;
               border:1px solid rgba(255,255,255,0.3);color:#fff;
               font-family:inherit;font-size:11px;letter-spacing:2px;cursor:pointer">
        ${T('gameover.restart')}
      </button>
    </div>`;
  document.body.appendChild(overlay);
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

export function install() {
  if (typeof window === 'undefined') return;
  window.showModal         = showModal;
  window.closeModal        = closeModal;
  window.showDayBulletin   = showDayBulletin;
  window.showAnimusMessage = showAnimusMessage;
  window.showDayStartEvent = showDayStartEvent;
  window.showGameOver      = showGameOver;
  console.log('[ModalManager] Installed.');
}
