/* ================================================================
   CHECKPOINT — UIManager
   DOM module. HUD updates, queue rendering, passenger profile,
   button state, family panel, and the main decision loop glue.

   Extracted from ui.js: updateHUD, renderQueue, renderFamilyPanel,
   enableButtons, disableButtons, addNote.

   All functions read game state via the `gs` argument (or fall back
   to window.GameState for legacy compatibility). Zero logic — pure
   rendering.

   Exports:
     updateHUD(gs)
     renderQueue(gs)
     renderFamilyPanel(gs)
     enableButtons()
     disableButtons()
     addNote(type, text)
     install()
================================================================ */

// ── HELPERS ───────────────────────────────────────────────────

function $(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

function T(key, params) {
  if (typeof window !== 'undefined' && typeof window.t === 'function') return window.t(key, params);
  return key;
}

function padZ(n, w) { return String(n).padStart(w, '0'); }

// ── HUD UPDATE ────────────────────────────────────────────────

/**
 * Refresh all HUD stat elements from the given game state.
 * @param {object} gs — GameState
 */
export function updateHUD(gs) {
  if (typeof document === 'undefined') return;

  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  const setClass = (id, cls) => { const el = $(id); if (el) el.className = 'value ' + cls; };

  set('stat-day',       gs.day);
  set('stat-processed', gs.processed);
  set('stat-errors',    gs.errors);

  const h = Math.floor(gs.time / 60);
  const m = gs.time % 60;
  set('stat-time', `${padZ(h, 2)}:${padZ(m, 2)}`);

  const money = gs.money ?? 0;
  set('stat-money', `€${money}`);
  setClass('stat-money',
    money >= 50 ? 'green' : money >= 20 ? 'yellow' : 'red');

  if (typeof window !== 'undefined' && typeof window.triggerMoneyTick === 'function') {
    window.triggerMoneyTick();
  }

  // Score + streak
  const scoreEl  = $('stat-score');
  const streakEl = $('streak-val');
  const streakDiv = $('streak-display');
  if (scoreEl) {
    scoreEl.textContent = gs.score.total;
    scoreEl.className   = 'value ' + (gs.score.total >= 0 ? '' : 'red');
  }
  if (streakEl)  streakEl.textContent = gs.score.streak;
  if (streakDiv) streakDiv.classList.toggle('active', gs.score.streak >= 3);

  // Morality bars (reads from StoryState if available)
  const ss = (typeof window !== 'undefined') ? window.StoryState : null;
  if (ss) {
    const bars = [
      { bar: 'moral-compassion-bar', val: 'moral-compassion-val', v: ss.compassion },
      { bar: 'moral-loyalty-bar',    val: 'moral-loyalty-val',    v: ss.loyalty    },
      { bar: 'moral-corruption-bar', val: 'moral-corruption-val', v: ss.corruption },
    ];
    bars.forEach(({ bar, val, v }) => {
      const b = $(bar), l = $(val);
      if (b) b.style.width = Math.min(v, 100) + '%';
      if (l) l.textContent = v;
    });
  }

  // PHANTOM indicator
  if (ss && ss.phantom && ss.phantom.contacted) {
    const phantomEl  = $('phantom-indicator');
    const phantomVal = $('stat-phantom');
    if (phantomEl)  phantomEl.style.display = 'flex';
    if (phantomVal) {
      const t = ss.phantom.trust;
      phantomVal.textContent = t > 60 ? 'TRUSTED' : t > 30 ? 'WATCHING' : 'CAUTIOUS';
      phantomVal.style.color = t > 60 ? 'var(--green)' : t > 30 ? '#c0a0ff' : 'var(--text-dim)';
    }
  }
}

// ── QUEUE RENDERING ───────────────────────────────────────────

/**
 * Re-render the passenger queue sidebar.
 * @param {object} gs — GameState
 */
export function renderQueue(gs) {
  if (typeof document === 'undefined') return;
  const list = $('queue-list');
  if (!list) return;
  list.innerHTML = '';

  gs.passengers.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'queue-item' + (i === gs.currentIndex - 1 ? ' active' : '');
    div.textContent = `${p.firstName} ${p.lastName}`;
    list.appendChild(div);
  });
}

// ── FAMILY PANEL ──────────────────────────────────────────────

/**
 * Re-render the family health panel.
 * @param {object} gs — GameState
 */
export function renderFamilyPanel(gs) {
  if (typeof document === 'undefined') return;
  const container = $('family-members');
  if (!container) return;

  const icons = { spouse: '♀', child: '♂' };
  container.innerHTML = gs.family.members.map(m => {
    const label = m.alive
      ? T('family.' + m.health)
      : T('family.deceased');
    return `
      <div class="family-member">
        <div class="member-icon">${icons[m.id] || '◆'}</div>
        <div class="member-info">
          <div class="member-name">${m.name}</div>
          <div class="member-health health-${m.health}">${label}</div>
        </div>
      </div>`;
  }).join('');
}

// ── NOTES ─────────────────────────────────────────────────────

/**
 * Append a note item to the notes panel.
 * @param {'info'|'warn'|'danger'} type
 * @param {string} text
 */
export function addNote(type, text) {
  if (typeof document === 'undefined') return;
  const list = $('notes-list');
  if (!list) return;
  const div = document.createElement('div');
  div.className = `note-item ${type}`;
  div.textContent = text;
  list.appendChild(div);
}

// ── BUTTON STATE ──────────────────────────────────────────────

export function enableButtons() {
  if (typeof document === 'undefined') return;
  ['btn-approve', 'btn-deny', 'btn-detain', 'btn-flag'].forEach(id => {
    const el = $(id); if (el) el.disabled = false;
  });
  const info = $('action-info');
  if (info) info.textContent = T('action.decide');
}

export function disableButtons() {
  if (typeof document === 'undefined') return;
  ['btn-approve', 'btn-deny', 'btn-detain', 'btn-flag'].forEach(id => {
    const el = $(id); if (el) el.disabled = true;
  });
  const info = $('action-info');
  if (info) info.textContent = T('action.scanning');
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

export function install() {
  if (typeof window === 'undefined') return;

  // Wrap functions to read window.GameState for legacy callers
  window.updateHUD = () => {
    if (window.GameState) updateHUD(window.GameState);
  };
  window.renderQueue = () => {
    if (window.GameState) renderQueue(window.GameState);
  };
  window.renderFamilyPanel = () => {
    if (window.GameState) renderFamilyPanel(window.GameState);
  };
  window.enableButtons  = enableButtons;
  window.disableButtons = disableButtons;
  window.addNote        = addNote;

  console.log('[UIManager] Installed.');
}
