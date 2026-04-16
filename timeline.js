/* ════════════════════════════════════════════════════
   CHECKPOINT — TIMELINE SYSTEM
   Master day-progression engine.
   Depends on: lang.js, game.js, story.js
════════════════════════════════════════════════════ */
'use strict';

(function () {

  // ── DAY CONFIGURATIONS ────────────────────────────────────────
  // Each entry describes everything that changes on a given day.
  // rules[]        → array of t() keys rendered in the bulletin
  // bulletinTitle  → t() key for bulletin modal title
  // featureUnlock  → { titleKey, bodyKey } shown once via features.js
  // wantedPerson   → { name, nationality, crimeKey } or null
  // specialEvent   → { type, payload } or null
  // security_level → 'normal' | 'elevated' | 'high'

  const DAY_CONFIGS = {
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
  // Each rule: { day, condition(gameState), effect(gameState) }
  const CONDITIONAL_EVENTS = [
    {
      id:   'reznik_surveillance',
      day:  10,
      condition: function (gs, ss) {
        return ss && ss.corruption >= 40;
      },
      effect: function (gs, ss) {
        if (ss) ss.flags.reznikWarned = true;
      },
      descriptionKey: null, // internal — manifests through character dialogue
    },
    {
      id:   'animus_symbol_boost',
      day:  -1, // ongoing: checked every day
      condition: function (gs, ss) {
        return ss && ss.animus && ss.animus.tasksFollowed >= 2;
      },
      effect: function (gs, ss) {
        // Handled by passenger generation — increases chance of ◈-marked passengers
        if (gs) gs.animusSymbolBoost = true;
      },
    },
    {
      id:   'viktor_second_appearance',
      day:  11,
      condition: function (gs, ss) {
        return ss && ss.flags && !ss.flags.vitoAlive; // Viktor escaped on day 6
      },
      effect: function (gs, ss) {
        // Extra wanted bulletin injected by getDayConfig()
      },
    },
    {
      id:   'crying_family_denied_news',
      day:  9,
      condition: function (gs, ss) {
        // If a micro-event crying_family was denied (tracked as flag)
        return ss && ss.flags && ss.flags.cryingFamilyDenied;
      },
      effect: function (gs, ss) {
        if (gs) gs.conditionalNews = 'crying_family_consequence';
      },
    },
    {
      id:   'diplomatic_incident_penalty',
      day:  12,
      condition: function (gs, ss) {
        return ss && ss.flags && ss.flags.diplomaticIncident;
      },
      effect: function (gs, ss) {
        if (gs) gs.conditionalPenalty = { amount: 20, reason: 'Diplomatic incident' };
      },
    },
  ];

  // ── PUBLIC API ────────────────────────────────────────────────

  window.Timeline = {

    /**
     * Get config for a specific day (falls back to day 21 for days > 21).
     */
    getDayConfig: function (day) {
      return DAY_CONFIGS[day] || DAY_CONFIGS[21];
    },

    /**
     * Get the rules object from RULEBOOK for a given day.
     * Delegates to story.js getRulesForDay() if available.
     */
    getRules: function (day) {
      if (window.getRulesForDay) return window.getRulesForDay(day);
      return null;
    },

    /**
     * Get rule text keys for the daily bulletin.
     */
    getRuleKeys: function (day) {
      const cfg = this.getDayConfig(day);
      return cfg ? cfg.rules : ['rules.day1'];
    },

    /**
     * Returns the wanted person bulletin for the day (or null).
     */
    getWantedBulletin: function (day) {
      const cfg = this.getDayConfig(day);
      return (cfg && cfg.wantedPerson) ? cfg.wantedPerson : null;
    },

    /**
     * Returns the feature unlock object for the day (or null).
     * These are displayed by features.js as slide-in notifications.
     */
    getFeatureUnlock: function (day) {
      const cfg = this.getDayConfig(day);
      return (cfg && cfg.featureUnlock) ? cfg.featureUnlock : null;
    },

    /**
     * Returns the security level for a day: 'normal' | 'elevated' | 'high'
     */
    getSecurityLevel: function (day) {
      const cfg = this.getDayConfig(day);
      return (cfg && cfg.security_level) || 'normal';
    },

    /**
     * Evaluate all conditional events for the given day.
     * Mutates gameState/storyState in place via effect functions.
     * @param {number}  day
     * @param {object}  gameState   — window.GameState
     * @param {object}  storyState  — window.StoryState (if available)
     */
    checkConditionalEvents: function (day, gameState, storyState) {
      CONDITIONAL_EVENTS.forEach(function (rule) {
        if (rule.day !== -1 && rule.day !== day) return;
        try {
          if (rule.condition(gameState, storyState)) {
            rule.effect(gameState, storyState);
          }
        } catch (e) {
          // Silently ignore — conditional events must never crash the game
        }
      });
    },

    /**
     * Build a formatted wanted-bulletin HTML string using t() keys.
     */
    buildWantedHTML: function (day) {
      const T = window.t || (k => k);
      const wanted = this.getWantedBulletin(day);
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

  console.log('[CHECKPOINT] Timeline system loaded. Days configured:', Object.keys(DAY_CONFIGS).length);

})();
