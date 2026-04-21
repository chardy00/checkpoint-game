/* ================================================================
   CHECKPOINT — TimelineSystem
   Pure data + logic module. Zero DOM, zero side-effects.

   Master day-progression engine.
   Extracted from timeline.js (full replacement).

   Exports:
     DAY_CONFIGS                           — raw day config map
     CONDITIONAL_EVENTS                    — conditional rule array
     getDayConfig(day)                     → config object
     getRuleKeys(day)                      → string[]
     getWantedBulletin(day)               → wanted object | null
     getFeatureUnlock(day)                → feature object | null
     getSecurityLevel(day)                → 'normal'|'elevated'|'high'
     checkConditionalEvents(day, gs, ss)  → void (mutates gs/ss)
     install()                            → patches window.Timeline
================================================================ */

// ── DAY CONFIGURATIONS ────────────────────────────────────────

export const DAY_CONFIGS = {
  1: {
    day: 1,
    rules: ['rules.day1'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
  2: {
    day: 2,
    rules: ['rules.day2'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.unlockTitle', bodyKey: 'feature.visa.body' },
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
  3: {
    day: 3,
    rules: ['rules.day3'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.unlockTitle', bodyKey: 'feature.biometric.body' },
    wantedPerson:  null,
    specialEvent:  { type: 'health_alert', payload: { nation: 'DEU', region: 'Bavaria' } },
    interpol_alert: false,
    health_alert:   true,
    security_level: 'normal',
  },
  4: {
    day: 4,
    rules: ['rules.day4'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: false,
    health_alert:   true,
    security_level: 'normal',
  },
  5: {
    day: 5,
    rules: ['rules.day5'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.unlockTitle', bodyKey: 'feature.rfid.body' },
    wantedPerson: {
      name:        'DMITRI VOLKOV',
      nationality: 'UKR',
      crimeKey:    'wanted.crimes.forgery',
      description: 'Operates under multiple aliases. Known to carry forged EU residence permits.',
    },
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   true,
    security_level: 'normal',
  },
  6: {
    day: 6,
    rules: ['rules.day6'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   true,
    security_level: 'normal',
  },
  7: {
    day: 7,
    rules: ['rules.day7'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'diplomatic_summit', payload: {} },
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
  8: {
    day: 8,
    rules: ['rules.day8'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'animus_first_contact', payload: {} },
    interpol_alert: true,
    health_alert:   false,
    security_level: 'elevated',
  },
  9: {
    day: 9,
    rules: ['rules.day9'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'elevated',
  },
  10: {
    day: 10,
    rules: ['rules.day10'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.unlockTitle', bodyKey: 'feature.ees.body' },
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'elevated',
  },
  11: {
    day: 11,
    rules: ['rules.day11'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson: {
      name:        'HASSAN AL-RASHID',
      nationality: 'SYR',
      crimeKey:    'wanted.crimes.smuggling',
      description: 'Suspected of operating a people-smuggling route via Istanbul transit.',
    },
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'elevated',
  },
  12: {
    day: 12,
    rules: ['rules.day12'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'animus_message', payload: { day: 12 } },
    interpol_alert: true,
    health_alert:   false,
    security_level: 'elevated',
  },
  13: {
    day: 13,
    rules: ['rules.day13'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson: {
      name:        'ELENA MARCHETTI',
      nationality: 'ITA',
      crimeKey:    'wanted.crimes.drugs',
      description: 'Courier for a narcotics distribution ring. Uses student visa cover.',
    },
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  14: {
    day: 14,
    rules: ['rules.day14'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.warning14.title', bodyKey: 'feature.warning14.body' },
    wantedPerson:  null,
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  15: {
    day: 15,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'animus_final', payload: {} },
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  16: {
    day: 16,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson: {
      name:        'VIKTOR MARSH',
      nationality: 'ROU',
      crimeKey:    'wanted.crimes.forgery',
      description: 'Second confirmed appearance. Previously evaded custody. Considered armed.',
    },
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  17: {
    day: 17,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'visa_agreement', payload: { nation: 'UKR' } },
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
  18: {
    day: 18,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'flight_cancellations', payload: { nation: 'ITA' } },
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
  19: {
    day: 19,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: { titleKey: 'feature.final.title', bodyKey: 'feature.final.body' },
    wantedPerson: {
      name:        'ARTEM KOVALENKO',
      nationality: 'UKR',
      crimeKey:    'wanted.crimes.terror',
      description: 'INTERPOL RED NOTICE. Do not approach. Alert security immediately upon identification.',
    },
    specialEvent:  null,
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  20: {
    day: 20,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'animus_alignment_check', payload: {} },
    interpol_alert: true,
    health_alert:   false,
    security_level: 'high',
  },
  21: {
    day: 21,
    rules: ['rules.day15'],
    bulletinTitle: null,
    featureUnlock: null,
    wantedPerson:  null,
    specialEvent:  { type: 'final_day', payload: {} },
    interpol_alert: false,
    health_alert:   false,
    security_level: 'normal',
  },
};

// ── CONDITIONAL EVENT RULES ───────────────────────────────────

export const CONDITIONAL_EVENTS = [
  {
    id:  'reznik_surveillance',
    day: 10,
    condition: (gs, ss) => ss && ss.corruption >= 40,
    effect:    (gs, ss) => { if (ss) ss.flags.reznikWarned = true; },
  },
  {
    id:  'animus_symbol_boost',
    day: -1,  // ongoing: checked every day
    condition: (gs, ss) => ss && ss.animus && ss.animus.tasksFollowed >= 2,
    effect:    (gs)      => { if (gs) gs.animusSymbolBoost = true; },
  },
  {
    id:  'viktor_second_appearance',
    day: 11,
    condition: (gs, ss) => ss && ss.flags && !ss.flags.vitoAlive,
    effect:    ()        => { /* Extra wanted bulletin injected by getDayConfig() */ },
  },
  {
    id:  'crying_family_denied_news',
    day: 9,
    condition: (gs, ss) => ss && ss.flags && ss.flags.cryingFamilyDenied,
    effect:    (gs)      => { if (gs) gs.conditionalNews = 'crying_family_consequence'; },
  },
  {
    id:  'diplomatic_incident_penalty',
    day: 12,
    condition: (gs, ss) => ss && ss.flags && ss.flags.diplomaticIncident,
    effect:    (gs)      => { if (gs) gs.conditionalPenalty = { amount: 20, reason: 'Diplomatic incident' }; },
  },
];

// ── PUBLIC API ────────────────────────────────────────────────

/**
 * Get config for a specific day (falls back to day 21 for days > 21).
 * @param {number} day
 * @returns {object}
 */
export function getDayConfig(day) {
  return DAY_CONFIGS[day] || DAY_CONFIGS[21];
}

/**
 * Get rule text keys for the daily bulletin.
 * @param {number} day
 * @returns {string[]}
 */
export function getRuleKeys(day) {
  const cfg = getDayConfig(day);
  return cfg ? cfg.rules : ['rules.day1'];
}

/**
 * Returns the wanted person bulletin for the day (or null).
 * @param {number} day
 * @returns {object|null}
 */
export function getWantedBulletin(day) {
  const cfg = getDayConfig(day);
  return (cfg && cfg.wantedPerson) ? cfg.wantedPerson : null;
}

/**
 * Returns the feature unlock object for the day (or null).
 * @param {number} day
 * @returns {object|null}
 */
export function getFeatureUnlock(day) {
  const cfg = getDayConfig(day);
  return (cfg && cfg.featureUnlock) ? cfg.featureUnlock : null;
}

/**
 * Returns the security level for a day.
 * @param {number} day
 * @returns {'normal'|'elevated'|'high'}
 */
export function getSecurityLevel(day) {
  const cfg = getDayConfig(day);
  return (cfg && cfg.security_level) || 'normal';
}

/**
 * Evaluate all conditional events for the given day.
 * Mutates gameState/storyState in place via effect functions.
 * @param {number} day
 * @param {object} gs   — GameState
 * @param {object} ss   — StoryState (optional)
 */
export function checkConditionalEvents(day, gs, ss) {
  CONDITIONAL_EVENTS.forEach(rule => {
    if (rule.day !== -1 && rule.day !== day) return;
    try {
      if (rule.condition(gs, ss)) rule.effect(gs, ss);
    } catch (_) {
      // Conditional events must never crash the game
    }
  });
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.Timeline so that legacy code continues to work.
 */
export function install() {
  if (typeof window === 'undefined') return;

  window.Timeline = {
    getDayConfig,
    getRuleKeys,
    getWantedBulletin,
    getFeatureUnlock,
    getSecurityLevel,
    checkConditionalEvents,

    /** Delegates to RuleEngine if available. */
    getRules(day) {
      if (typeof window.getRulesForDay === 'function') return window.getRulesForDay(day);
      return null;
    },

    /** Build wanted-bulletin HTML (requires window.t for i18n). */
    buildWantedHTML(day) {
      const T = (typeof window !== 'undefined' && window.t) ? window.t : (k => k);
      const wanted = getWantedBulletin(day);
      if (!wanted) return '';
      return `
        <div style="margin-top:10px;padding:10px 12px;
          background:rgba(255,51,85,0.06);border:1px solid rgba(255,51,85,0.25);
          font-family:var(--font-mono,monospace);font-size:9px;line-height:1.8;">
          <div style="color:var(--red,#f44);letter-spacing:2px;margin-bottom:6px;">
            ⚠ ${T('wanted.bulletin')}
          </div>
          <div><span style="color:rgba(255,255,255,0.4)">${T('wanted.name')}:</span>
               <strong style="color:#fff">${wanted.name}</strong></div>
          <div><span style="color:rgba(255,255,255,0.4)">${T('wanted.nationality')}:</span>
               ${wanted.nationality}</div>
          <div><span style="color:rgba(255,255,255,0.4)">${T('wanted.crime')}:</span>
               ${T(wanted.crimeKey)}</div>
          <div style="margin-top:4px;color:rgba(255,255,255,0.55);font-style:italic;">
            ${wanted.description}
          </div>
        </div>`;
    },
  };

  console.log('[TimelineSystem] Installed. Days configured:', Object.keys(DAY_CONFIGS).length);
}
