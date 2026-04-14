/* ============================================================
   CHECKPOINT — UI Controller
   Handles document rendering, biometric display, decisions
   ============================================================ */

'use strict';

// ── DOM REFS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  passengerName:    $('passenger-name'),
  passengerMeta:    $('passenger-meta'),
  passengerBehavior:$('passenger-behavior'),
  docTabs:          $('doc-tabs'),
  docContent:       $('doc-content'),
  docEmpty:         $('doc-empty'),
  queueList:        $('queue-list'),
  bioFaceResult:    $('bio-face-result'),
  bioFaceBar:       $('bio-face-bar'),
  bioFingerResult:  $('bio-finger-result'),
  bioFingerBar:     $('bio-finger-bar'),
  bioChipResult:    $('bio-chip-result'),
  dbInterpol:       $('db-interpol'),
  dbNational:       $('db-national'),
  dbVisa:           $('db-visa'),
  dbEes:            $('db-ees'),
  dbFlight:         $('db-flight'),
  notesList:        $('notes-list'),
  btnApprove:       $('btn-approve'),
  btnDeny:          $('btn-deny'),
  btnDetain:        $('btn-detain'),
  btnFlag:          $('btn-flag'),
  actionInfo:       $('action-info'),
  alertBar:         $('alert-bar'),
  modalOverlay:     $('modal-overlay'),
  modalTitle:       $('modal-title'),
  modalBody:        $('modal-body'),
  modalActions:     $('modal-actions'),
};

// ── AUDIO SYSTEM ─────────────────────────────────────────────
let _actx = null;
function _ctx() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}

function _tone(freq, type, dur, vol = 0.35, delay = 0) {
  try {
    const c = _ctx(), osc = c.createOscillator(), env = c.createGain();
    osc.connect(env); env.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    env.gain.setValueAtTime(0, c.currentTime + delay);
    env.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + dur + 0.05);
  } catch(e) {}
}

function _rising(f0, f1, dur, vol = 0.2) {
  try {
    const c = _ctx(), osc = c.createOscillator(), env = c.createGain();
    osc.connect(env); env.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, c.currentTime);
    osc.frequency.linearRampToValueAtTime(f1, c.currentTime + dur);
    env.gain.setValueAtTime(vol, c.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur + 0.05);
  } catch(e) {}
}

// ── VOLUME CONTROL ────────────────────────────────────────────
let _volume = 0.8;
(function loadVol() {
  try { const s = JSON.parse(localStorage.getItem('chk_settings')||'{}'); if (s.volume != null) _volume = s.volume / 100; } catch(e) {}
})();

// Exposed so settings.js can update volume live without page reload
window.setVolume = function(pct) {
  _volume = Math.max(0, Math.min(100, +pct)) / 100;
};

function soundApprove() { _tone(80,  'sine',    0.10, 0.5 * _volume); }
function soundDeny()     { _tone(200, 'sawtooth',0.15, 0.4 * _volume); }
function soundAlert()    { _tone(880,'square',0.08,0.3*_volume,0); _tone(880,'square',0.08,0.3*_volume,0.13); _tone(880,'square',0.08,0.3*_volume,0.26); }
function soundScanner()  { _rising(300, 600, 2.5, 0.18 * _volume); }
function soundPhantom()  { _tone(55, 'sine', 0.3, 0.5 * _volume); }

// ── STATE ─────────────────────────────────────────────────────
let scanComplete = false;
let activeTab    = 'passport';
let pendingPassenger = null;

// ── QUEUE RENDERING ───────────────────────────────────────────
function renderQueue() {
  const ps = window.GameState.passengers;
  DOM.queueList.innerHTML = '';
  ps.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'queue-item' + (i === window.GameState.currentIndex - 1 ? ' current' : '');
    div.id = `q-${p.id}`;

    const dec = window.GameState.decisions.find(d => d.id === p.id);
    let badge = '';
    if (dec) {
      badge = dec.correct
        ? `<span class="queue-badge done-ok">${window.t('queue.ok')}</span>`
        : `<span class="queue-badge done-err">${window.t('queue.err')}</span>`;
    }

    div.innerHTML = `<span class="q-num">#${i + 1}</span>
      <span>${p.lastName}, ${p.firstName}</span>
      <span style="margin-left:auto;font-size:10px;color:#3a4560">${p.nation.substring(0,3).toUpperCase()}</span>
      ${badge}`;
    DOM.queueList.appendChild(div);
  });
}

// ── PASSENGER PROFILE ─────────────────────────────────────────
function renderPassengerProfile(p) {
  DOM.passengerName.textContent = `${p.lastName}, ${p.firstName}`;
  DOM.passengerMeta.innerHTML   =
    `${p.nation}<br>${p.sex === 'M' ? window.t('field.male') : window.t('field.female')} · DOB ${p.dob}<br>` +
    `${p.height}cm · ${p.weight}kg`;

  if (p.behavior) {
    DOM.passengerBehavior.textContent = p.behavior;
    DOM.passengerBehavior.style.display = 'block';
  } else {
    DOM.passengerBehavior.style.display = 'none';
  }
}

// ── DOCUMENT TABS ─────────────────────────────────────────────
function buildTabs(p) {
  const T = window.t || (k => k);

  // Build tab list — missing docs show as greyed-out stubs
  const tabs = [];

  if (p.missingPassport) {
    tabs.push({ id: 'passport', label: T('tab.missing'), missing: true });
  } else {
    tabs.push({ id: 'passport', label: T('tab.passport') });
  }

  if (p.visa) {
    tabs.push({ id: 'visa', label: T('tab.visa') });
  } else if (p.missingPassport) {
    // no visa possible without passport — don't add
  } else if (window.VISA_REQUIRED && window.VISA_REQUIRED.includes(p.nation)) {
    // visa required but not present — show missing tab
    tabs.push({ id: 'visa', label: T('tab.missing'), missing: true });
  }

  if (p.boardingPass) {
    tabs.push({ id: 'boarding', label: T('tab.boarding') });
  } else if (p.missingBoardingPass) {
    tabs.push({ id: 'boarding', label: T('tab.missing'), missing: true });
  }

  if (!p.missingPassport) {
    tabs.push({ id: 'chip', label: T('tab.chip') });
  }

  DOM.docTabs.innerHTML = '';
  tabs.forEach(t => {
    const el = document.createElement('div');
    el.className  = 'doc-tab' + (t.id === activeTab && !t.missing ? ' active' : '') + (t.missing ? ' missing-doc' : '');
    el.textContent = t.label;
    el.dataset.tab = t.id;
    if (!t.missing) {
      el.addEventListener('click', () => switchTab(t.id, p));
    } else {
      // Clicking a missing tab shows a dialogue prompt
      el.addEventListener('click', () => showMissingDocDialogue(t.id, p));
    }
    DOM.docTabs.appendChild(el);
  });
}

function switchTab(tabId, p) {
  activeTab = tabId;
  document.querySelectorAll('.doc-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabId);
  });
  renderDocContent(tabId, p);
}

// ── MISSING DOCUMENT DIALOGUE (Part 5) ────────────────────────
function showMissingDocDialogue(tabId, p) {
  const T = window.t || (k => k);
  const isPassport = tabId === 'passport';

  const question = isPassport ? T('dialogue.wherePassport') : T('dialogue.whereVisa');
  const responses = [
    T('passenger.forgot'),
    T('passenger.stolen'),
    ...(isPassport ? [] : [T('passenger.didntKnow')]),
  ];

  const responseHtml = responses.map(r =>
    `<div style="margin:4px 0;padding:6px 10px;background:rgba(255,255,255,0.03);border-left:2px solid rgba(255,255,255,0.1);font-size:11px;color:var(--text-dim)">${r}</div>`
  ).join('');

  const flagHtml = isPassport
    ? `<div style="margin-top:14px;padding:8px 10px;background:rgba(255,60,60,0.08);border-left:3px solid var(--red);font-size:11px;color:var(--red)">${T('flag.noPassport')}</div>`
    : `<div style="margin-top:14px;padding:8px 10px;background:rgba(255,180,0,0.08);border-left:3px solid var(--yellow);font-size:11px;color:var(--yellow)">${T('flag.missingVisa')}</div>`;

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px;line-height:1.9">
    <div style="color:var(--accent);margin-bottom:12px">"${question}"</div>
    ${responseHtml}
    ${flagHtml}
    <div style="margin-top:14px;font-size:10px;color:var(--text-dim);font-style:italic">
      ${isPassport ? 'Entry cannot be processed without a valid travel document. Mandatory DENY.' : 'Visa required for this nationality. Proceed to decision.'}
    </div>
  </div>`;

  showModal(T('modal.missingDoc') || 'MISSING DOCUMENT', body, [
    { label: T('modal.ack') || 'Understood', action: () => closeModal() },
  ]);
}

// ── DOCUMENT CONTENT ──────────────────────────────────────────
function renderDocContent(tabId, p) {
  const T = window.t || (k => k);
  const hasMismatch = p.anomalies.some(a => a.type === 'chip_mismatch');

  if (tabId === 'passport') {
    // Missing passport — show placeholder
    if (!p.passport) {
      DOM.docContent.innerHTML = `
      <div class="passport-doc" style="border-color:rgba(255,60,60,0.3)">
        <div class="doc-title" style="color:var(--red)">${T('tab.missing')} — ${T('doc.passport.title')}</div>
        <div style="margin-top:20px;padding:16px;background:rgba(255,0,0,0.05);border-left:3px solid var(--red);font-size:12px;color:var(--red);line-height:2">
          ${T('flag.noPassport')}
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--text-dim)">
          ${T('dialogue.wherePassport')}
        </div>
      </div>`;
      return;
    }

    const expired = p.anomalies.some(a => a.type === 'expired_passport');
    DOM.docContent.innerHTML = `
    <div class="passport-doc">
      <div class="doc-title">${T('doc.passport.title')}</div>
      <div class="doc-country">${p.nation.toUpperCase()}</div>

      ${field(T('field.surname'),      p.lastName)}
      ${field(T('field.givenNames'),   p.firstName)}
      ${field(T('field.nationality'),  p.nation)}
      ${field(T('field.dob'),          p.dob)}
      ${field(T('field.sex'),          p.sex === 'M' ? T('field.male') : T('field.female'))}
      ${field(T('field.height'),       p.height + ' cm')}
      ${field(T('field.weight'),       p.weight + ' kg')}
      ${field(T('field.issuingCity'),  p.issueCity)}
      ${field(T('field.passportNo'),   p.passport.number)}
      ${field(T('field.expiration'),   p.passport.expiry, expired ? 'anomaly' : '')}

      <div class="mrz-block">
        <div class="mrz-label">${T('field.mrz')}</div>
        ${p.passport.mrzL1}<br>${p.passport.mrzL2}
      </div>
    </div>`;
  }

  else if (tabId === 'chip') {
    if (!p.passport) {
      DOM.docContent.innerHTML = `<div class="passport-doc" style="border-color:rgba(255,60,60,0.3)"><div class="doc-title" style="color:var(--red)">${T('tab.missing')}</div></div>`;
      return;
    }
    const chip = p.passport.chip;
    DOM.docContent.innerHTML = `
    <div class="passport-doc">
      <div class="doc-title">${T('doc.chip.title')}</div>
      <div class="chip-block" style="margin-bottom:14px">
        <div class="chip-header">
          <div class="chip-indicator" style="background:${hasMismatch ? 'var(--red)' : 'var(--green)'}"></div>
          ${hasMismatch ? T('chip.mismatch') : T('chip.ok')}
        </div>
      </div>

      ${field(T('field.chipName'),   chip.name,   hasMismatch ? 'warn' : '')}
      ${field(T('field.chipDob'),    chip.dob)}
      ${field(T('field.nationality'),chip.nation)}
      ${field(T('field.chipNo'),     hasMismatch ? chip.number + 'X' : chip.number, hasMismatch ? 'anomaly' : '')}
      ${field(T('field.chipExpiry'), chip.expiry, hasMismatch ? 'anomaly' : '')}
      ${field(T('field.biohash'),    chip.biohash)}
      ${field(T('field.chipStatus'), hasMismatch ? T('chip.mismatched') : T('chip.verified'), hasMismatch ? 'anomaly' : 'ok')}
    </div>`;
  }

  else if (tabId === 'visa' && p.visa) {
    const expiredVisa = p.anomalies.some(a => a.type === 'expired_visa');
    DOM.docContent.innerHTML = `
    <div class="passport-doc">
      <div class="doc-title">${T('doc.visa.title')}</div>
      ${field(T('field.visaType'),    p.visa.type)}
      ${field(T('field.visaNo'),      p.visa.number)}
      ${field(T('field.visaIssued'),  p.visa.issued)}
      ${field(T('field.visaExpires'), p.visa.expiry, expiredVisa ? 'anomaly' : '')}
      ${field(T('field.visaPurpose'), p.visa.purpose)}
      ${field(T('field.visaIssuedBy'),p.visa.nation)}
      ${field(T('field.visaStatus'),  expiredVisa ? T('visa.expired') : T('visa.valid'), expiredVisa ? 'anomaly' : '')}
    </div>`;
  }

  else if (tabId === 'boarding' && p.boardingPass) {
    const nameMismatch = p.anomalies.some(a => a.type === 'boarding_name_mismatch');
    DOM.docContent.innerHTML = `
    <div class="passport-doc">
      <div class="doc-title">${T('doc.boarding.title')}</div>
      ${field(T('field.passenger'), p.boardingPass.passengerName, nameMismatch ? 'anomaly' : '')}
      ${field(T('field.flight'),    p.boardingPass.flightNo + ' · ' + p.boardingPass.airline)}
      ${field(T('field.route'),     p.boardingPass.from + ' → ' + p.boardingPass.to)}
      ${field(T('field.date'),      p.boardingPass.date)}
      ${field(T('field.seat'),      p.boardingPass.seat)}
      ${nameMismatch ? `<div style="margin-top:10px;padding:8px;background:rgba(255,51,85,0.08);border-left:3px solid var(--red);font-size:11px;color:var(--red)">${T('boarding.mismatch')}</div>` : ''}
    </div>`;
  }
}

function field(label, value, cls = '') {
  return `<div class="doc-field">
    <span class="field-label">${label}</span>
    <span class="field-value ${cls}">${value}</span>
  </div>`;
}

// ── BIOMETRIC DISPLAY ─────────────────────────────────────────
function resetBiometrics() {
  ['bio-face-result','bio-finger-result','bio-chip-result'].forEach(id => {
    const el = $(id);
    el.className = 'bio-result pending';
    el.textContent = window.t('bio.scanning');
    el.classList.add('scanning');
  });
  DOM.bioFaceBar.style.width   = '0%';
  DOM.bioFingerBar.style.width = '0%';
  DOM.bioFaceBar.style.background   = '#5a6378';
  DOM.bioFingerBar.style.background = '#5a6378';
  resetDB();
  DOM.notesList.innerHTML = '';
}

function resetDB() {
  ['db-interpol','db-national','db-visa','db-ees','db-flight'].forEach(id => {
    const el = $(id);
    el.className = 'db-status pending';
    el.textContent = window.t('db.querying');
  });
}

function animateBiometrics(p) {
  soundScanner();
  const b = p.biometrics;
  const d = p.dbChecks;

  // Face scan — 600ms
  setTimeout(() => {
    const el = DOM.bioFaceResult;
    el.classList.remove('scanning');
    el.textContent = b.faceOk
      ? window.t('bio.matchOk',   { score: b.faceScore })
      : window.t('bio.matchFail', { score: b.faceScore });
    el.className   = 'bio-result ' + (b.faceOk ? 'ok' : 'fail');
    const color    = b.faceOk ? 'var(--green)' : 'var(--red)';
    DOM.bioFaceBar.style.width      = b.faceScore + '%';
    DOM.bioFaceBar.style.background = color;
    // Scan-line animation — sweep the portrait
    triggerBioScanLine();
  }, 600);

  // Fingerprint — 1000ms
  setTimeout(() => {
    const el = DOM.bioFingerResult;
    el.classList.remove('scanning');
    el.textContent = b.fingerOk
      ? window.t('bio.matchOk',    { score: b.fingerScore })
      : window.t('bio.fingerFail', { score: b.fingerScore });
    el.className   = 'bio-result ' + (b.fingerOk ? 'ok' : 'fail');
    const color    = b.fingerOk ? 'var(--green)' : 'var(--red)';
    DOM.bioFingerBar.style.width      = b.fingerScore + '%';
    DOM.bioFingerBar.style.background = color;
  }, 1000);

  // Chip — 1400ms
  setTimeout(() => {
    const el = DOM.bioChipResult;
    el.classList.remove('scanning');
    el.textContent = tDB(b.chipRead);
    el.className   = 'bio-result ' + (b.chipOk ? 'ok' : 'fail');
  }, 1400);

  // DB checks — staggered after chip
  const dbItems = [
    { el: DOM.dbInterpol, val: d.interpol, delay: 1600 },
    { el: DOM.dbNational, val: d.national, delay: 1900 },
    { el: DOM.dbVisa,     val: d.visa,     delay: 2100 },
    { el: DOM.dbEes,      val: d.ees,      delay: 2300 },
    { el: DOM.dbFlight,   val: d.flight,   delay: 2500 },
  ];

  dbItems.forEach(({ el, val, delay }) => {
    setTimeout(() => {
      el.textContent = tDB(val);
      el.className   = 'db-status ' + dbStatusClass(val);
    }, delay);
  });

  // Render anomaly flags + enable buttons after all scans
  setTimeout(() => {
    renderFlags(p);
    enableButtons();
    scanComplete = true;
  }, 2800);
}

function dbStatusClass(val) {
  if (!val || val === '—' || val === 'QUERYING...') return 'pending';
  if (val === 'CLEAR' || val === 'CONFIRMED' || val === 'VALID' || val === 'NO PRIOR ENTRY' || val === 'N/A') return 'ok';
  if (val.includes('HIT') || val === 'EXPIRED' || val === 'MISSING' || val.includes('OVERSTAY')) return 'alert';
  return 'warn';
}

// Translate a raw sentinel DB/bio value to the current language
function tDB(val) {
  const T = window.t;
  const map = {
    'CLEAR':                   T('db.val.clear'),
    'CONFIRMED':                T('db.val.confirmed'),
    'N/A':                      T('db.val.na'),
    'NO PRIOR ENTRY':           T('db.val.noEntry'),
    'PENDING':                  T('db.val.pending'),
    'MISMATCH':                 T('db.val.mismatch'),
    'EXPIRED':                  T('db.val.expired'),
    'MISSING':                  T('db.val.missing'),
    'OK':                       T('chip.verified'),
    'QUERYING...':              T('db.querying'),
  };
  if (map[val]) return map[val];
  if (val && val.includes('HIT')) return T('db.val.hit') + (val.includes('—') ? ' — ' + val.split('—')[1].trim() : '');
  if (val && val.includes('OVERSTAY')) return T('db.val.overstay');
  return val || '—';
}

// ── ANIMATION HELPERS (Part 6) ────────────────────────────────

// Biometric scan line sweeps over portrait
function triggerBioScanLine() {
  const photo = document.getElementById('passenger-photo');
  if (!photo) return;
  const line = document.createElement('div');
  line.className = 'bio-scan-line';
  photo.appendChild(line);
  setTimeout(() => line.remove(), 700);
}

// Flash right-panel border red on anomaly
function triggerAlertFlash() {
  const panel = document.getElementById('right-panel');
  if (!panel) return;
  panel.classList.remove('alert-flash');
  void panel.offsetWidth; // reflow
  panel.classList.add('alert-flash');
  setTimeout(() => panel.classList.remove('alert-flash'), 1200);
}

// Walk-in animation for new passenger
function triggerPassengerWalkIn() {
  const photo = document.getElementById('passenger-photo');
  if (!photo) return;
  photo.classList.remove('walk-in');
  void photo.offsetWidth;
  photo.classList.add('walk-in');
}

// Document slide-up animation
function triggerDocSlide() {
  const wrap = document.getElementById('doc-content-wrap');
  if (!wrap) return;
  wrap.classList.remove('doc-slide');
  void wrap.offsetWidth;
  wrap.classList.add('doc-slide');
}

// Money tick animation (topbar balance)
function triggerMoneyTick() {
  const el = document.getElementById('stat-money');
  if (!el) return;
  el.classList.remove('money-tick');
  void el.offsetWidth;
  el.classList.add('money-tick');
}
window.triggerMoneyTick = triggerMoneyTick;

// ── FLAG NOTES ────────────────────────────────────────────────
function renderFlags(p) {
  DOM.notesList.innerHTML = '';

  if (p.anomalies.length === 0 && !p.missingPassport && !p.missingBoardingPass) {
    addNote('info', window.t('notes.allClear'));
    return;
  }

  if (p.anomalies.some(a => a.severity === 'critical')) { soundAlert(); triggerAlertFlash(); }
  else if (p.anomalies.some(a => a.severity === 'high')) triggerAlertFlash();

  p.anomalies.forEach(a => {
    const cls  = a.severity === 'critical' ? 'danger' : a.severity === 'high' ? 'warn' : 'info';
    const text = a.i18n ? window.t(a.i18n.key, a.i18n.params) : a.desc;
    addNote(cls, text);
  });

  // Missing document structural flags
  if (p.missingPassport) {
    addNote('danger', window.t('flag.noPassport'));
  }
  if (p.missingBoardingPass) {
    addNote('warn', window.t('flag.missingBoarding'));
  }

  // Show micro-event note
  if (p.microEvent) {
    const T = window.t;
    const microMap = {
      bribe_offer:        { cls:'warn',   key:'micro.bribeOffer'      },
      diplomatic_immunity:{ cls:'warn',   key:'micro.diplomatic'      },
      lost_boarding_pass: { cls:'info',   key:'micro.lostBoarding'    },
      nickname_mismatch:  { cls:'info',   key:'micro.nicknameMismatch'},
      visibly_ill:        { cls:'danger', key:'micro.visiblyIll'      },
      crying_child:       { cls:'info',   key:'micro.cryingChild'     },
    };
    const m = microMap[p.microEvent.type];
    if (m) addNote(m.cls, T(m.key));
  }
}

function addNote(type, text) {
  const div = document.createElement('div');
  div.className = `note-item ${type}`;
  div.textContent = text;
  DOM.notesList.appendChild(div);
}

// ── ACTION BUTTONS ────────────────────────────────────────────
function enableButtons() {
  DOM.btnApprove.disabled = false;
  DOM.btnDeny.disabled    = false;
  DOM.btnDetain.disabled  = false;
  DOM.btnFlag.disabled    = false;
  DOM.actionInfo.textContent = window.t('action.decide');
}

function disableButtons() {
  DOM.btnApprove.disabled = true;
  DOM.btnDeny.disabled    = true;
  DOM.btnDetain.disabled  = true;
  DOM.btnFlag.disabled    = true;
  DOM.actionInfo.textContent = window.t('action.scanning');
}

// ── DECISION HANDLING ─────────────────────────────────────────
function handleDecision(decision) {
  if (!scanComplete) return;

  disableButtons();
  if (decision === 'approve') soundApprove(); else soundDeny();
  const result = window.recordDecision(decision);

  // Story: record character decision
  recordStoryDecision(result.passenger, decision);

  // Update queue badge
  const qItem = document.getElementById(`q-${result.passenger.id}`);
  if (qItem) {
    const badge = qItem.querySelector('.queue-badge') || document.createElement('span');
    badge.className = 'queue-badge ' + (result.correct ? 'done-ok' : 'done-err');
    badge.textContent = result.correct ? window.t('queue.ok') : window.t('queue.err');
    if (!qItem.querySelector('.queue-badge')) qItem.appendChild(badge);
  }

  const decisionLabels = {
    approve: window.t('action.approved'),
    deny:    window.t('action.denied'),
    detain:  window.t('action.detained'),
    flag:    window.t('action.flagged'),
  };

  // Show brief result, then load next passenger
  DOM.actionInfo.textContent = decisionLabels[decision];

  // Penalty warning
  if (!result.correct) {
    showPenaltyWarning(result.passenger);
  } else {
    setTimeout(() => loadNextPassenger(), 1200);
  }
}

function showPenaltyWarning(p) {
  const expected = p.correctDecision.toUpperCase();
  const T = window.t;
  const reason = p.anomalies.length ? p.anomalies.map(a => a.desc).join('<br>') : T('penalty.none');
  showModal(
    T('penalty.title'),
    `${T('penalty.flagged')}<br><br>
     ${T('penalty.correct')} <strong>${expected}</strong><br><br>
     ${T('penalty.reason')} ${reason}<br><br>
     <span style="color:var(--red)">${T('penalty.amount', { amount: 5 })}</span>`,
    [{ label: T('penalty.ack'), action: () => { closeModal(); loadNextPassenger(); } }]
  );
}

// ── LOAD NEXT PASSENGER ───────────────────────────────────────
function loadNextPassenger() {
  scanComplete  = false;
  activeTab     = 'passport';

  const p = window.nextPassenger();
  if (!p) return; // day ended — showDaySummary already called

  renderQueue();
  renderPassengerProfile(p);
  buildTabs(p);
  renderDocContent('passport', p);
  resetBiometrics();
  disableButtons();
  DOM.actionInfo.textContent = window.t('action.scanning');
  // Animations
  setTimeout(triggerPassengerWalkIn, 50);
  setTimeout(triggerDocSlide, 150);

  renderFamilyPanel();

  // Phantom note tab
  if (p.phantomNote) addPhantomNoteTab(p);

  // Envelope tab for bribe courier
  if (p.hasEnvelope) addEnvelopeTab(p);

  // Special flags for auditor badge, red thread, terrorist
  if (p.badgeNumber)   addNote('warn',   window.t('flag.auditor',  { badge: p.badgeNumber }));
  if (p.redThread)     addNote('danger', window.t('flag.redThread'));
  if (p.isTerrorist)   addNote('danger', window.t('flag.threat'));
  if (p.hasEnvelope)   addNote('warn',   window.t('flag.envelope'));
  if (p.isPhantomTarget) addNote('info', window.t('flag.phantom'));

  setTimeout(() => {
    animateBiometrics(p);
    // Story character: after scan trigger dialogue
    if (p.isStoryCharacter && p.dialogue) {
      const delay = p.anomalies.length > 0 ? 3300 : 3000;
      setTimeout(() => showCharacterDialogue(p), delay);
    }
    // Bribe courier: show bribe modal after scan
    if (p.hasEnvelope) {
      setTimeout(() => showBribeModal(p), 3000);
    }
  }, 300);
}

// ── FAMILY PANEL RENDERER ─────────────────────────────────────
function renderFamilyPanel() {
  const container = document.getElementById('family-members');
  if (!container) return;
  const members = window.GameState.family.members;

  const icons = { spouse: '♀', child: '♂' };
  container.innerHTML = members.map(m => {
    const hClass = `health-${m.health}`;
    const label  = m.alive ? window.t('family.' + m.health) : window.t('family.deceased');
    return `
    <div class="family-member">
      <div class="member-icon">${icons[m.id] || '◆'}</div>
      <div class="member-info">
        <div class="member-name">${m.name}</div>
        <div class="member-relation">${m.relation}</div>
      </div>
      <div class="member-health ${hClass}">${label}</div>
    </div>`;
  }).join('');
}

// ── DAY SUMMARY — INTERACTIVE EXPENSE SCREEN ─────────────────
window.showDaySummary = function() {
  const gs      = window.GameState;
  const correct = gs.decisions.filter(d => d.correct).length;
  const errors  = gs.decisions.filter(d => !d.correct).length;
  const earned  = correct * 10;
  const deducted = errors * 5;
  const balance = gs.money;   // already reflects earned/deducted

  // Build selected expense state
  const hasSick = window.needsMedicine();
  const expenseState = {
    food:     balance >= 20,
    heat:     balance >= 15,
    medicine: hasSick && balance >= 30,
  };

  function calcTotal() {
    let t = 0;
    if (expenseState.food)     t += 20;
    if (expenseState.heat)     t += 15;
    if (expenseState.medicine) t += 30;
    return t;
  }

  function rebuildExpenseSection() {
    const remaining = balance - calcTotal();
    document.getElementById('expense-remaining').textContent = `€${remaining}`;
    document.getElementById('expense-remaining').style.color =
      remaining >= 0 ? 'var(--green)' : 'var(--red)';

    ['food','heat','medicine'].forEach(id => {
      const row  = document.getElementById(`exp-row-${id}`);
      if (!row) return;
      const cost = { food: 20, heat: 15, medicine: 30 }[id];
      const sel  = expenseState[id];
      const canAfford = balance - (calcTotal() - (sel ? cost : 0)) >= 0;

      row.classList.toggle('selected', sel);
      row.classList.toggle('cant-afford', !sel && !canAfford);

      const chk = row.querySelector('.expense-check');
      if (chk) chk.textContent = sel ? '✓' : '';
    });
  }

  // Build score details
  const scoreBreakdown = gs.decisions.slice(-gs.decisions.length).map(d => {
    const sign = d.scoreChange >= 0 ? '+' : '';
    const col  = d.scoreChange >= 0 ? 'var(--green)' : 'var(--red)';
    return `<span style="color:${col}">${sign}${d.scoreChange}</span>`;
  }).join('  ');

  const T = window.t;
  const body = `
  <div style="font-family:var(--font-mono);font-size:12px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

      <!-- LEFT: earnings + score -->
      <div>
        <div style="color:var(--accent);letter-spacing:2px;font-size:11px;margin-bottom:10px">
          ${T('summary.report', { day: gs.day })}
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:4px 16px;margin-bottom:12px">
          <span style="color:var(--text-dim)">${T('summary.processed')}</span>
          <span>${gs.decisions.length}</span>
          <span style="color:var(--text-dim)">${T('summary.correct')}</span>
          <span style="color:var(--green)">${correct}</span>
          <span style="color:var(--text-dim)">${T('summary.errors')}</span>
          <span style="color:var(--red)">${errors}</span>
          <span style="color:var(--text-dim)">${T('summary.warnings')}</span>
          <span style="color:${gs.warnings > 0 ? 'var(--orange)' : 'var(--text-dim)'}">${gs.warnings}</span>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px">
          <div style="color:var(--text-dim);font-size:10px;letter-spacing:2px;margin-bottom:6px">${T('summary.earnings')}</div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:4px 16px">
            <span style="color:var(--text-dim)">${T('summary.salary')}</span>
            <span style="color:var(--green)">+€${earned}</span>
            <span style="color:var(--text-dim)">${T('summary.penalties')}</span>
            <span style="color:var(--red)">-€${deducted}</span>
            <span style="color:var(--text-dim);border-top:1px solid var(--border);padding-top:4px">${T('summary.balance')}</span>
            <span style="color:var(--text-bright);border-top:1px solid var(--border);padding-top:4px" id="summary-balance-val">€${balance}</span>
          </div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:10px">
          <div style="color:var(--text-dim);font-size:10px;letter-spacing:2px;margin-bottom:6px">${T('summary.score')}</div>
          <div style="color:var(--accent);font-size:18px;font-weight:bold">${gs.score.total}</div>
          <div style="color:var(--text-dim);font-size:10px;margin-top:2px">
            ${T('summary.bestStreak')}: ${gs.score.bestStreak}x
          </div>
          ${gs.decisions.length > 0 ? `<div style="margin-top:6px;font-size:10px;line-height:1.8">${scoreBreakdown}</div>` : ''}
        </div>
      </div>

      <!-- RIGHT: expenses + family -->
      <div>
        <div style="color:var(--accent);letter-spacing:2px;font-size:11px;margin-bottom:10px">
          ${T('expense.title')}
        </div>

        <div id="exp-row-food" class="expense-row ${expenseState.food ? 'selected' : ''}" onclick="toggleExpense('food',${balance})">
          <div class="expense-check">${expenseState.food ? '✓' : ''}</div>
          <div class="expense-icon">◈</div>
          <div class="expense-label">
            <div class="expense-name">${T('expense.food')}</div>
            <div class="expense-consequence">${T('expense.foodConseq')}</div>
          </div>
          <div class="expense-cost">€20</div>
        </div>

        <div id="exp-row-heat" class="expense-row ${expenseState.heat ? 'selected' : ''}" onclick="toggleExpense('heat',${balance})">
          <div class="expense-check">${expenseState.heat ? '✓' : ''}</div>
          <div class="expense-icon">◉</div>
          <div class="expense-label">
            <div class="expense-name">${T('expense.heat')}</div>
            <div class="expense-consequence">${T('expense.heatConseq')}</div>
          </div>
          <div class="expense-cost">€15</div>
        </div>

        <div id="exp-row-medicine" class="expense-row ${hasSick ? (expenseState.medicine ? 'selected' : 'required-sick') : ''} ${!hasSick ? 'cant-afford' : ''}"
             onclick="toggleExpense('medicine',${balance})" style="${!hasSick ? 'pointer-events:none;opacity:0.4' : ''}">
          <div class="expense-check">${expenseState.medicine ? '✓' : ''}</div>
          <div class="expense-icon">✚</div>
          <div class="expense-label">
            <div class="expense-name">${T('expense.medicine')} ${hasSick ? `<span style="color:var(--red)">${T('expense.needed')}</span>` : ''}</div>
            <div class="expense-consequence">${T('expense.medConseq')}</div>
          </div>
          <div class="expense-cost">€30</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;
                    border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
          <span style="color:var(--text-dim);font-size:10px">${T('expense.remaining')}</span>
          <span id="expense-remaining" style="font-size:14px;font-weight:bold"></span>
        </div>

        <!-- Family health -->
        <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
          <div style="color:var(--text-dim);font-size:10px;letter-spacing:2px;margin-bottom:8px">${T('summary.family')}</div>
          ${window.GameState.family.members.map(m => {
            const hColor = {
              healthy: 'var(--green)', hungry: 'var(--yellow)', cold: '#88ccff',
              sick: 'var(--orange)', critical: 'var(--red)', dead: '#444'
            }[m.health] || 'var(--text-dim)';
            const hLabel = m.alive ? T('family.' + m.health) : T('family.deceased');
            return `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px">
              <span>${m.name} <span style="color:var(--text-dim);font-size:10px">(${m.relation})</span></span>
              <span style="color:${hColor};font-weight:bold">${hLabel}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  </div>`;

  showModal(T('summary.title'), body, [{
    label: T('summary.confirm'),
    action: () => {
      const paid = { ...expenseState };
      const total = (paid.food ? 20 : 0) + (paid.heat ? 15 : 0) + (paid.medicine ? 30 : 0);
      closeModal();

      // Apply family consequences
      window.applyDayConsequences(paid);

      // Amara saved Anton — heal him for free
      if (window.StoryState && window.StoryState.flags.amaraSavedAnton) {
        const anton = gs.family.members.find(m => m.id === 'child');
        if (anton && anton.health !== 'dead') { anton.health = 'healthy'; anton.sickDays = 0; }
        window.StoryState.flags.amaraSavedAnton = false; // one-time
      }

      // Advance state
      gs.day++;
      gs.money    = Math.max(0, balance - total);
      gs.errors   = 0;
      gs.warnings = 0;
      gs.processed = 0;
      gs.decisions = [];
      gs.score.streak = 0;

      renderFamilyPanel();
      updateHUD();

      // Check for endings before starting next day
      if (checkAndTriggerEnding()) return;

      // Check for game-over (all family dead)
      const anyAlive = gs.family.members.some(m => m.alive);
      if (!anyAlive) { showGameOver(); return; }

      // Start next day — show bulletin + optional story event
      window.startDay();
      updateBulletinBoard();
      const dayEvent = window.getDayStartEvent ? window.getDayStartEvent(gs.day) : null;
      showDayBulletin(gs.day, dayEvent, () => loadNextPassenger());
    }
  }]);

  // Initialise balance display
  setTimeout(() => {
    rebuildExpenseSection();
    // Expose toggle to global scope (called from onclick)
    window._expenseState   = expenseState;
    window._expenseBalance = balance;
    window._rebuildExpenses = rebuildExpenseSection;
  }, 50);
};

// ── MODAL HELPERS ─────────────────────────────────────────────
function showModal(title, body, actions) {
  DOM.modalTitle.innerHTML = title;
  DOM.modalBody.innerHTML  = body;
  DOM.modalActions.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className   = 'action-btn ' + (a.cls || 'btn-approve');
    btn.textContent = a.label;
    btn.style.cssText = 'padding:8px 16px;font-size:11px;letter-spacing:1px';
    btn.addEventListener('click', a.action);
    DOM.modalActions.appendChild(btn);
  });
  DOM.modalOverlay.classList.add('show');
}

function closeModal() {
  DOM.modalOverlay.classList.remove('show');
}

// ── BULLETIN BOARD ────────────────────────────────────────────
window.updateBulletinBoard = function updateBulletinBoard() {
  const el = document.getElementById('bulletin-content');
  if (!el) return;
  const T   = window.t;
  const day = window.GameState ? window.GameState.day : 1;
  const rules = window.getRulesForDay ? window.getRulesForDay(day) : null;
  if (!rules) { el.textContent = '—'; return; }

  const bannedHtml = rules.bannedNations
    ? `<div style="color:var(--red);margin-top:3px">${T('bulletin.banned', { nations: rules.bannedNations.join(', ') })}</div>` : '';
  const threatHtml = rules.terrorLevel
    ? `<div style="color:var(--red);animation:blink 1s infinite;margin-top:3px">${T('bulletin.threat')}</div>` : '';
  const interpol = rules.interpol === 'detain'
    ? `<div style="color:var(--orange);margin-top:3px">${T('bulletin.interpol')}</div>` : '';

  el.innerHTML = `
    <div style="color:var(--accent);font-size:9px;letter-spacing:1.5px;margin-bottom:4px">${T('bulletin.activeRules', { day })}</div>
    <div style="color:var(--text);font-size:10px;line-height:1.6;border-left:2px solid var(--accent-dim);padding-left:6px;margin-bottom:3px">${rules.label}</div>
    <div style="font-size:9px;color:var(--text-dim);margin-top:3px">
      ${T('bulletin.visa')} <span style="color:${rules.visaRequired?'var(--yellow)':'var(--green)'}">${rules.visaRequired?T('bulletin.required'):T('bulletin.no')}</span>
      &nbsp;·&nbsp; ${T('bulletin.chip')} <span style="color:${rules.chipCheck?'var(--yellow)':'var(--text-dim)'}">${rules.chipCheck?T('bulletin.mandatory'):T('bulletin.optional')}</span>
    </div>
    ${bannedHtml}${threatHtml}${interpol}`;
};

// ── DAY BULLETIN MODAL ────────────────────────────────────────
function showDayBulletin(day, storyEvent, onDone) {
  const T     = window.t;
  const rules = window.getRulesForDay ? window.getRulesForDay(day) : null;

  if (storyEvent && storyEvent.type === 'terror_warning') {
    DOM.alertBar.classList.add('show');
    setTimeout(() => DOM.alertBar.classList.remove('show'), 8000);
  }

  const ruleBlock = rules ? `
    <div style="background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.18);padding:12px 14px;margin-bottom:14px">
      <div style="font-size:9px;letter-spacing:2px;color:var(--accent);margin-bottom:7px">${T('modal.update', { day })}</div>
      <div style="color:var(--text-bright);font-size:12px;line-height:1.9">${rules.label}</div>
      ${rules.bannedNations ? `<div style="margin-top:6px;color:var(--red);font-size:11px">${T('modal.bannedEntry', { nations: rules.bannedNations.join(', ') })}</div>` : ''}
      ${rules.terrorLevel  ? `<div style="margin-top:6px;color:var(--red);font-size:11px">${T('modal.threatElev')}</div>` : ''}
      ${rules.interpol === 'detain' ? `<div style="margin-top:6px;color:var(--orange);font-size:11px">${T('modal.interpolDetain')}</div>` : ''}
      ${rules.overstayDetain ? `<div style="margin-top:6px;color:var(--orange);font-size:11px">${T('modal.overstayDetain')}</div>` : ''}
    </div>` : '';

  const typeColors = {
    bulletin: 'var(--accent)', news: 'var(--text-bright)',
    terror_warning: 'var(--red)', phantom_message: '#c0a0ff', consequence: 'var(--yellow)',
  };
  const eventBlock = storyEvent ? `
    <div style="border-left:3px solid ${typeColors[storyEvent.type]||'var(--yellow)'};
                padding:10px 14px;background:rgba(255,255,255,0.02);margin-bottom:10px">
      <div style="font-size:9px;letter-spacing:2px;color:var(--text-dim);margin-bottom:5px">
        ${storyEvent.type==='phantom_message'?'&#9649; ':''} ${storyEvent.type.replace(/_/g,' ').toUpperCase()}
      </div>
      <div style="font-size:12px;line-height:1.9;color:var(--text)">${storyEvent.content}</div>
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

  showModal(T('modal.ministry'), body, [
    {
      label: T('modal.ack'),
      action: () => {
        closeModal();
        // After bulletin — check if ANIMUS has a message for this day
        const animusMsg = window.getAnimusDayMessage ? window.getAnimusDayMessage(day) : null;
        if (animusMsg && window.showAnimusMessage) {
          window.showAnimusMessage(animusMsg.text, onDone);
        } else {
          onDone();
        }
      },
    },
  ]);
}

// ── STORY: CHARACTER DIALOGUE ─────────────────────────────────
const R = v => (typeof v === 'function' ? v() : v); // resolve dynamic values

function showCharacterDialogue(p) {
  if (!p.dialogue) { enableButtons(); return; }

  const charId = p.storyCharId;
  const day    = p.storyAppearanceDay;

  // Resolve dynamic dialogue branch
  let dlg = p.dialogue;
  if (dlg.dynamic) {
    if (dlg.dynamic === 'elias_11') dlg = window.getElias11Dialogue ? window.getElias11Dialogue() : null;
    if (!dlg) { enableButtons(); return; }
  }
  // Reznik day 14: dynamic choices (function)
  if (charId === 'reznik' && day === 14 && p.dialogue.choices === undefined) {
    const rezDlg = window.CHARACTERS && window.CHARACTERS.reznik && window.CHARACTERS.reznik.appearances[14]
      ? window.CHARACTERS.reznik.appearances[14].dialogue : null;
    if (rezDlg) dlg = rezDlg;
  }

  const char     = window.CHARACTERS ? window.CHARACTERS[charId] : null;
  const icon     = char ? char.icon : '?';
  const charName = p.charName || (char ? char.name : charId);
  const memories = window.StoryState && window.StoryState.memory[charId] ? window.StoryState.memory[charId] : [];
  const timesSeen = memories.length;

  // Resolve choices (can be a function for branching)
  const choices = typeof dlg.choices === 'function' ? dlg.choices() : (dlg.choices || []);
  const intro   = R(dlg.intro);
  const line    = R(dlg.line);

  const choiceHTML = choices.map((c, i) =>
    `<div onclick="storyChoice('${charId}',${i},${day})"
      style="padding:9px 14px;margin:5px 0;border:1px solid var(--border);cursor:pointer;font-size:12px;color:var(--text);transition:background 0.15s;user-select:none"
      onmouseover="this.style.background='rgba(0,212,255,0.07)'"
      onmouseout="this.style.background='transparent'">
      <span style="color:var(--accent-dim);margin-right:10px">${i+1}.</span>${c.text}
    </div>`
  ).join('');

  const phantomHtml = p.phantomFirstContact
    ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(128,0,255,0.09);border:1px solid rgba(128,0,255,0.35);font-size:11px;color:#c0a0ff;letter-spacing:1px">⬡ PHANTOM — FIRST CONTACT</div>`
    : p.phantomNote
    ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(128,0,255,0.06);border-left:3px solid rgba(128,0,255,0.5);font-size:11px;color:#c0a0ff">⬡ A loose slip falls from the documents:<br><em style="color:#a080e0;font-size:10px">"${p.phantomNote}"</em></div>`
    : '';

  const badgeHtml = p.badgeNumber
    ? `<div style="margin-top:8px;padding:6px 10px;background:rgba(255,136,0,0.08);border-left:3px solid var(--orange);font-size:11px;color:var(--orange)">⚠ Badge #${p.badgeNumber} visible on the counter</div>`
    : '';

  const redThreadHtml = p.redThread
    ? `<div style="margin-top:8px;padding:6px 10px;background:rgba(255,51,85,0.08);border-left:3px solid var(--red);font-size:11px;color:var(--red)">⚠ A red thread is looped through the passport lanyard</div>`
    : '';

  const seenBadge = timesSeen > 0
    ? `<span style="display:inline-block;font-size:9px;letter-spacing:1px;padding:2px 7px;background:rgba(0,212,255,0.08);border:1px solid var(--accent-dim);color:var(--accent-dim);margin-bottom:8px">ENCOUNTERED ${timesSeen}×</span>`
    : '';

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px">
    <div style="display:flex;gap:14px;margin-bottom:14px;align-items:flex-start">
      <div style="width:54px;height:54px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--accent);background:rgba(0,212,255,0.04);flex-shrink:0">${icon}</div>
      <div style="flex:1">
        ${seenBadge}
        <div style="color:var(--text-dim);font-size:11px;line-height:1.7;font-style:italic">${intro}</div>
      </div>
    </div>
    <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-left:3px solid var(--accent);margin-bottom:10px;line-height:1.8;color:var(--text-bright)">${line}</div>
    ${phantomHtml}${badgeHtml}${redThreadHtml}
    <div style="margin-top:12px;font-size:9px;color:var(--text-dim);letter-spacing:2px;margin-bottom:5px">YOUR RESPONSE:</div>
    <div id="story-choices">${choiceHTML}</div>
    <div id="story-response" style="display:none"></div>
    <div id="story-note" style="display:none"></div>
  </div>`;

  window._storyPassenger = p;
  window._storyDlg       = dlg;
  window._storyChoices   = choices;

  showModal(`— ${charName.toUpperCase()} —`, body, []);
}

// Called from inline onclick in character dialogue
window.storyChoice = function(charId, choiceIndex, day) {
  const dlg     = window._storyDlg;
  const p       = window._storyPassenger;
  const choices = window._storyChoices;
  if (!dlg || !choices) return;

  const choice = choices[choiceIndex];
  if (!choice) return;
  const key = choice.key;

  // Resolve response and note (can be functions or keyed strings)
  const responses = dlg.responses || {};
  const rawResp   = typeof responses[key] === 'function' ? responses[key]() : responses[key];
  const rawNote   = R(dlg.note);

  // Apply morality effect
  if (window.applyDialogueEffect) {
    window.applyDialogueEffect(choice.effect || {}, key, charId, day);
  }

  // Handle flags
  if (choice.flag && window.StoryState) window.StoryState.flags[choice.flag] = true;

  // Handle PHANTOM task choices
  if (window.handlePhantomChoiceEffect) {
    window.handlePhantomChoiceEffect(key, choice.phantomAccept, choice.phantomRefuse);
  }

  // Handle phantomGivesTask from passenger
  if (p.phantomGivesTask) {
    if (window.handlePhantomTaskGiven) window.handlePhantomTaskGiven(p.phantomGivesTask, key);
    // Update contacted flag
    if (window.StoryState && !window.StoryState.phantom.contacted) {
      const acceptKeys = ['read','accept','maybe','ask'];
      if (acceptKeys.includes(key)) window.StoryState.phantom.contacted = true;
    }
  }

  // Render response
  const choicesEl  = document.getElementById('story-choices');
  const responseEl = document.getElementById('story-response');
  const noteEl     = document.getElementById('story-note');

  if (choicesEl) choicesEl.style.display = 'none';

  if (responseEl && rawResp) {
    responseEl.style.cssText = 'display:block;padding:10px 14px;background:rgba(255,255,255,0.03);border-left:3px solid var(--text-dim);margin-bottom:8px;font-size:12px;color:var(--text);line-height:1.8;font-style:italic';
    responseEl.textContent = rawResp;
  }

  if (noteEl && rawNote) {
    noteEl.style.cssText = 'display:block;padding:8px 10px;margin-top:8px;border-left:2px solid var(--yellow);background:rgba(255,204,0,0.05);font-size:11px;color:var(--yellow);font-style:italic';
    noteEl.textContent = rawNote;
  }

  DOM.modalActions.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'action-btn btn-flag';
  btn.style.cssText = 'padding:8px 16px;font-size:11px;letter-spacing:1px';
  btn.textContent = window.t('story.dismiss');
  btn.addEventListener('click', () => {
    closeModal();
    window._storyPassenger = null;
    window._storyDlg       = null;
    window._storyChoices   = null;
    enableButtons();
    updateHUD(); // refresh phantom indicator
  });
  DOM.modalActions.appendChild(btn);
};

// ── STORY: DECISION RECORDER ──────────────────────────────────
function recordStoryDecision(p, decision) {
  if (!window.recordCharacterDecision) return;
  if (p.isStoryCharacter || p.isPhantomTarget) {
    window.recordCharacterDecision(p.storyCharId, decision);
  }
  // ANIMUS passenger decision
  if (p.isAnimusPassenger && p.animusKey && window.recordCharacterDecision) {
    window.recordCharacterDecision(p.animusKey, decision);
  }
  // Terrorist caught bonus
  if (p.isTerrorist && decision === 'detain' && window.GameState) {
    window.GameState.money += 25;
    window.GameState.score.total += 25;
    addNote('danger', window.t('terrorist.caught'));
  }
}

// ── BRIBE EVENT ───────────────────────────────────────────────
function showBribeModal(p) {
  const T = window.t;
  const body = `
  <div style="font-family:var(--font-mono);font-size:12px">
    <div style="padding:12px 14px;background:rgba(255,204,0,0.05);border-left:3px solid var(--yellow);margin-bottom:14px;line-height:1.8">
      ${T('micro.bribeOffer')}<br>
      He says nothing. He doesn't look at you.<br>
      He waits.
    </div>
    <div style="padding:10px;background:rgba(0,0,0,0.3);font-size:11px;color:var(--text-dim);margin-bottom:14px">
      <em style="color:var(--yellow)">"${p.envelopeContent}"</em>
    </div>
  </div>`;

  showModal(window.t('bribe.title'), body, [
    {
      label: window.t('bribe.accept'),
      action: () => {
        closeModal();
        if (window.handleBribe) window.handleBribe(true);
        addNote('warn', window.t('bribe.accepted'));
        updateHUD();
        enableButtons();
      },
    },
    {
      label: window.t('bribe.refuse'),
      cls:   'btn-deny',
      action: () => {
        closeModal();
        if (window.handleBribe) window.handleBribe(false);
        addNote('info', window.t('bribe.refused'));
        updateHUD();
        enableButtons();
      },
    },
  ]);
}

// ── RULEBOOK DISPLAY ──────────────────────────────────────────
window.showRulebook = function() {
  const T     = window.t;
  const day   = window.GameState ? window.GameState.day : 1;
  const rules = window.getRulesForDay ? window.getRulesForDay(day) : null;
  if (!rules) return;

  const banned  = rules.bannedNations ? rules.bannedNations.join(', ') : T('rules.bannedNone');
  const nations = rules.nations === 'all' ? T('rules.allNations') : rules.nations.join(', ');

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px;line-height:2">
    <div style="color:var(--accent);letter-spacing:2px;font-size:11px;margin-bottom:12px">${T('rules.header', { day })}</div>

    <div style="padding:12px;background:rgba(0,212,255,0.04);border:1px solid rgba(0,212,255,0.15);margin-bottom:12px;font-size:13px;color:var(--text-bright)">
      ${rules.label}
    </div>

    <div style="display:grid;grid-template-columns:160px 1fr;gap:4px 16px">
      <span style="color:var(--text-dim)">${T('rules.permitted')}</span>
      <span>${nations}</span>
      <span style="color:var(--text-dim)">${T('rules.visa')}</span>
      <span style="color:${rules.visaRequired ? 'var(--yellow)' : 'var(--green)'}">${rules.visaRequired ? T('rules.yes') : T('rules.no')}</span>
      <span style="color:var(--text-dim)">${T('rules.chip')}</span>
      <span style="color:${rules.chipCheck ? 'var(--yellow)' : 'var(--text-dim)'}">${rules.chipCheck ? T('rules.chipMand') : T('rules.chipOpt')}</span>
      <span style="color:var(--text-dim)">${T('rules.banned')}</span>
      <span style="color:${rules.bannedNations ? 'var(--red)' : 'var(--text-dim)'}">${banned}</span>
      <span style="color:var(--text-dim)">${T('rules.interpol')}</span>
      <span>${rules.interpol === 'detain' ? `<span style="color:var(--red)">${T('rules.interpolDetain')}</span>` : `<span style="color:var(--orange)">${T('rules.interpolDeny')}</span>`}</span>
      <span style="color:var(--text-dim)">${T('rules.ees')}</span>
      <span>${rules.overstayDetain ? `<span style="color:var(--red)">${T('rules.eesDetain')}</span>` : T('rules.eesDeny')}</span>
      ${rules.terrorLevel ? `<span style="color:var(--text-dim)">${T('rules.threat')}</span><span style="color:var(--red);animation:blink 1s infinite">${T('rules.threatElev')}</span>` : ''}
    </div>
  </div>`;

  showModal(T('rules.title'), body, [
    { label: T('rules.close'), action: () => closeModal() },
  ]);
};

// ── STORY: PHANTOM NOTE TAB ───────────────────────────────────
function addPhantomNoteTab(p) {
  soundPhantom();
  const T = window.t;
  const tab = document.createElement('div');
  tab.className   = 'doc-tab flagged';
  tab.textContent = T('tab.note');
  tab.dataset.tab = 'phantom';
  tab.addEventListener('click', () => {
    activeTab = 'phantom';
    document.querySelectorAll('.doc-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === 'phantom'));
    DOM.docContent.innerHTML = `
    <div class="passport-doc" style="border-color:rgba(128,0,255,0.3);background:rgba(128,0,255,0.05)">
      <div class="doc-title" style="color:#c0a0ff;letter-spacing:3px">${T('doc.phantom.title')}</div>
      <div style="margin-top:14px;padding:12px;background:rgba(0,0,0,0.3);font-family:var(--font-mono);
                  font-size:12px;color:#a080e0;line-height:1.9;letter-spacing:1px">${p.phantomNote}</div>
      <div style="margin-top:10px;font-size:10px;color:#5a3080">${T('doc.phantom.footer')}</div>
    </div>`;
  });
  DOM.docTabs.appendChild(tab);
}

function addEnvelopeTab(p) {
  const T = window.t;
  const tab = document.createElement('div');
  tab.className   = 'doc-tab flagged';
  tab.textContent = T('tab.envelope');
  tab.dataset.tab = 'envelope';
  tab.addEventListener('click', () => {
    activeTab = 'envelope';
    document.querySelectorAll('.doc-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === 'envelope'));
    DOM.docContent.innerHTML = `
    <div class="passport-doc" style="border-color:rgba(255,204,0,0.3);background:rgba(255,204,0,0.03)">
      <div class="doc-title" style="color:var(--yellow)">${T('doc.envelope.title')}</div>
      <div style="margin-top:14px;padding:12px;background:rgba(0,0,0,0.3);font-family:var(--font-mono);font-size:12px;color:var(--yellow);line-height:2">
        ${T('doc.envelope.body').replace(/\n/g,'<br>')}
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text-dim)">
        ${T('doc.envelope.warning')}
      </div>
    </div>`;
  });
  DOM.docTabs.appendChild(tab);
}

// ── STORY: DAY START EVENT ────────────────────────────────────
function showDayStartEvent(event, onDone) {
  if (!event) { onDone(); return; }

  const typeColors = {
    bulletin:        'var(--accent)',
    news:            'var(--text-bright)',
    terror_warning:  'var(--red)',
    phantom_message: '#c0a0ff',
    consequence:     'var(--yellow)',
  };
  const color = typeColors[event.type] || 'var(--text)';

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px;line-height:1.9;padding:4px 0">
    <div style="color:${color};letter-spacing:2px;font-size:10px;margin-bottom:12px;text-transform:uppercase">
      ${event.type === 'phantom_message' ? '⬡ ' : ''}${event.type.replace(/_/g,' ')}
    </div>
    <div style="color:var(--text);line-height:1.9">${event.content}</div>
  </div>`;

  // Terror event — flash alert bar
  if (event.type === 'terror_warning') {
    DOM.alertBar.classList.add('show');
    setTimeout(() => DOM.alertBar.classList.remove('show'), 8000);
  }

  showModal(event.title, body, [
    { label: window.t('modal.ack'), action: () => { closeModal(); onDone(); } },
  ]);
}

// ── STORY: ENDING SCREEN ──────────────────────────────────────
function showEnding(ending) {
  const text = typeof ending.text === 'function' ? ending.text() : ending.text;
  const note = typeof ending.moralNote === 'function' ? ending.moralNote() : ending.moralNote;
  const body = `
  <div style="font-family:var(--font-mono);font-size:12px;line-height:2;padding:4px 0">
    <div style="color:var(--accent);letter-spacing:3px;font-size:10px;margin-bottom:16px">${window.t('ending.unlocked')}</div>
    <div style="white-space:pre-line;color:var(--text);line-height:2">${text}</div>
    <div style="margin-top:20px;padding:10px;border-left:3px solid var(--accent-dim);
                font-size:10px;color:var(--text-dim);font-style:italic">${note || ''}</div>
  </div>`;

  showModal(`◆ ${ending.title}`, body, [
    { label: window.t('ending.newGame'), action: () => { closeModal(); location.reload(); } },
  ]);
}

// ── STORY: CHECK & TRIGGER ENDING ────────────────────────────
function checkAndTriggerEnding() {
  if (!window.checkEndingConditions) return false;
  const ending = window.checkEndingConditions();
  if (ending) {
    setTimeout(() => showEnding(ending), 400);
    return true;
  }
  return false;
}

// ── EXPENSE TOGGLE (called from modal onclick) ────────────────
window.toggleExpense = function(id, balance) {
  if (!window._expenseState) return;
  const state = window._expenseState;
  const costs = { food: 20, heat: 15, medicine: 30 };

  // Calculate what total would be if we flip this item
  const currentTotal = Object.entries(state).reduce((s, [k,v]) => s + (v ? costs[k] : 0), 0);
  const flipped = !state[id];
  const newTotal = currentTotal + (flipped ? costs[id] : -costs[id]);

  if (flipped && newTotal > balance) return; // can't afford
  state[id] = flipped;
  if (window._rebuildExpenses) window._rebuildExpenses();
};

// ── GAME OVER ─────────────────────────────────────────────────
function showGameOver() {
  const T = window.t;
  showModal(
    T('gameover.title'),
    `<div style="font-family:var(--font-mono);text-align:center;padding:20px 0">
      <div style="color:var(--red);font-size:24px;margin-bottom:16px">✖</div>
      <div style="color:var(--text);line-height:2;font-size:13px">
        ${T('gameover.family')}<br>
        ${T('gameover.score')} <span style="color:var(--accent)">${window.GameState.score.total}</span><br>
        ${T('gameover.days')} <span style="color:var(--text-bright)">${window.GameState.day - 1}</span>
      </div>
    </div>`,
    [{ label: T('gameover.newGame'), action: () => { closeModal(); location.reload(); } }]
  );
}

// ── ANIMUS DISPLAY (Part 7) ────────────────────────────────────

// Show ANIMUS paper-slip modal with typewriter effect
window.showAnimusMessage = function(msg, onDone) {
  const overlay = document.createElement('div');
  overlay.id = 'animus-overlay';
  overlay.style.cssText = [
    'position:absolute','inset:0','background:rgba(0,0,0,0.92)',
    'z-index:9990','display:flex','align-items:center','justify-content:center',
    'cursor:pointer',
  ].join(';');

  const box = document.createElement('div');
  box.style.cssText = [
    'width:420px','padding:32px 36px',
    'background:#080a08','border:1px solid #1a2a1a',
    'font-family:\'Courier Prime\',monospace','font-size:13px',
    'color:#50ff80','letter-spacing:1px','line-height:2',
    'box-shadow:0 0 40px rgba(0,80,0,0.4)',
  ].join(';');

  const symbol = document.createElement('div');
  symbol.textContent = '◈';
  symbol.style.cssText = 'font-size:22px;margin-bottom:18px;color:#20c040;opacity:0.7;';

  const text = document.createElement('div');
  text.style.cssText = 'min-height:80px;white-space:pre-wrap;';

  const dismiss = document.createElement('div');
  dismiss.textContent = '[ kapat / dismiss ]';
  dismiss.style.cssText = 'margin-top:22px;font-size:10px;color:#204020;letter-spacing:2px;';

  box.appendChild(symbol);
  box.appendChild(text);
  box.appendChild(dismiss);
  overlay.appendChild(box);

  const app = document.getElementById('app');
  if (app) app.appendChild(overlay); else document.body.appendChild(overlay);

  // Typewriter
  let i = 0;
  const interval = setInterval(() => {
    text.textContent = msg.slice(0, i);
    i++;
    if (i > msg.length) clearInterval(interval);
  }, 35);

  const close = () => {
    overlay.remove();
    if (onDone) onDone();
  };
  overlay.addEventListener('click', close);
  setTimeout(close, 14000); // auto-dismiss
};

// Glitch effect — brief wrong label for 2 seconds
window.triggerGlitch = function() {
  const glitchPairs = [
    ['btn-approve', 'KAÇIN'],
    ['btn-deny', 'GEÇIR'],
    ['stat-money', '???'],
  ];
  const pair = glitchPairs[Math.floor(Math.random() * glitchPairs.length)];
  const el = document.getElementById(pair[0]);
  if (!el) return;

  const labelEl = el.querySelector ? el.querySelector('.btn-label') : el;
  const target  = labelEl || el;
  const orig    = target.textContent;
  target.textContent = pair[1];
  target.style.color = '#40ff80';

  setTimeout(() => {
    target.textContent = orig;
    target.style.color = '';
  }, 1800);
};

// Passenger name ghost glitch ("SEN" for 1 second)
window.triggerNameGlitch = function() {
  const el = document.getElementById('passenger-name');
  if (!el || !el.textContent.trim()) return;
  const orig = el.textContent;
  el.textContent = 'SEN';
  el.style.color = '#40ff80';
  setTimeout(() => {
    el.textContent = orig;
    el.style.color = '';
  }, 1000);
};

// ANIMUS symbol faint corner overlay (Day 16+)
window.showAnimusSymbol = function() {
  const existing = document.getElementById('animus-corner');
  if (existing) return;
  const sym = document.createElement('div');
  sym.id = 'animus-corner';
  sym.textContent = '◈';
  sym.style.cssText = [
    'position:absolute','bottom:18px','right:22px',
    'font-size:18px','color:rgba(80,255,80,0.18)',
    'z-index:9950','pointer-events:none',
    'animation:animus-fade 4s ease-out forwards',
  ].join(';');
  const app = document.getElementById('app');
  if (app) { app.appendChild(sym); setTimeout(() => sym.remove(), 4000); }
};

// ── BUTTON LISTENERS ──────────────────────────────────────────
DOM.btnApprove.addEventListener('click', () => handleDecision('approve'));
DOM.btnDeny.addEventListener('click',    () => handleDecision('deny'));
DOM.btnDetain.addEventListener('click',  () => handleDecision('detain'));
DOM.btnFlag.addEventListener('click',    () => handleDecision('flag'));

// ── STARTUP ───────────────────────────────────────────────────
function init() {
  const saved = window.hasSave && window.hasSave();
  let savedDay = 1;
  if (saved) {
    try { savedDay = JSON.parse(localStorage.getItem('chk_save')).gs.day; } catch(e) {}
  }

  const T = window.t;
  const saveBlock = saved
    ? `<div style="padding:8px 12px;background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);
                   margin:10px 0 14px;font-size:11px;color:var(--accent);font-family:var(--font-mono)">
         ${T('init.saveFound', { day: savedDay })}
       </div>` : '';

  const body = `
  <div style="font-family:var(--font-mono);font-size:12px;line-height:2;color:var(--text)">
    ${T('init.welcome')}<br><br>
    ${T('init.desc')}
    ${saveBlock}
    <div style="color:var(--accent);font-size:11px;letter-spacing:1px;margin-top:4px">
      &#10003; ${T('btn.approve').replace(/^[✓✗▲⚑≡⚙\s]+/,'').trim()}
      &nbsp;·&nbsp; &#10007; ${T('btn.deny').replace(/^[✓✗▲⚑≡⚙\s]+/,'').trim()}
      &nbsp;·&nbsp; &#9650; ${T('btn.detain').replace(/^[✓✗▲⚑≡⚙\s]+/,'').trim()}
      &nbsp;·&nbsp; &#9873; ${T('btn.flag').replace(/^[✓✗▲⚑≡⚙\s]+/,'').trim()}
    </div>
  </div>`;

  const startFresh = () => {
    closeModal();
    window.clearSave && window.clearSave();
    window.startDay();
    renderFamilyPanel();
    updateBulletinBoard();
    const evt = window.getDayStartEvent ? window.getDayStartEvent(1) : null;
    showDayBulletin(1, evt, () => loadNextPassenger());
  };

  const continueGame = () => {
    closeModal();
    window.loadSave();
    window.startDay();
    renderFamilyPanel();
    updateHUD();
    updateBulletinBoard();
    const day = window.GameState.day;
    const evt = window.getDayStartEvent ? window.getDayStartEvent(day) : null;
    showDayBulletin(day, evt, () => loadNextPassenger());
  };

  const actions = saved
    ? [
        { label: T('init.continue', { day: savedDay }), action: continueGame, cls: 'btn-approve' },
        { label: T('init.newGame'), action: startFresh, cls: 'btn-deny' },
      ]
    : [{ label: T('init.begin'), action: startFresh, cls: 'btn-approve' }];

  showModal(T('init.title'), body, actions);
}

init();
