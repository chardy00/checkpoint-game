/* ================================================================
   CHECKPOINT — GameState
   Pure data module. Zero logic, zero DOM, zero side-effects.

   Exports:
     GAME_CONSTANTS   — scoring + economy values
     FAMILY_DEFAULTS  — initial family member rows
     EXPENSES_CONFIG  — household expense definitions
     SCORE_TABLE      — per-decision score deltas
     createGameState()— factory → fresh state object
     GameState        — singleton used by the legacy layer
     install(gs)      — patches window.GameState for backward compat
================================================================ */

// ── ECONOMY CONSTANTS ─────────────────────────────────────────
export const GAME_CONSTANTS = {
  SALARY_PER_CORRECT:  10,
  PENALTY_PER_MISTAKE:  5,
  COST_FOOD:           20,
  COST_HEAT:           15,
  COST_MEDICINE:       30,
  TIME_PER_PASSENGER: 180,   // simulated seconds
  DAY_DURATION:      1800,   // simulated seconds per day
};

// ── SCORE TABLE ───────────────────────────────────────────────
export const SCORE_TABLE = {
  CORRECT_APPROVE:  10,
  CORRECT_DENY:     10,
  CORRECT_DETAIN:   15,  // bonus for catching criminals
  CORRECT_FLAG:      8,
  WRONG_APPROVE:   -10,  // let criminal / bad-doc through
  WRONG_DENY:       -5,  // turned away valid traveller
  WRONG_DETAIN:    -10,  // false detention
  WRONG_FLAG:       -3,
  PENALTY_WARNING:  -5,  // supervisor warning
  TERRORIST_CAUGHT: 25,
  TERRORIST_MISSED:-20,
};

// ── FAMILY DEFAULTS ───────────────────────────────────────────
/** Deep-clone this before placing into a state object. */
export const FAMILY_DEFAULTS = [
  { id: 'spouse', name: 'Mirela', relation: 'Spouse', health: 'healthy', sickDays: 0, alive: true },
  { id: 'child',  name: 'Anton',  relation: 'Son',    health: 'healthy', sickDays: 0, alive: true },
];

// ── HOUSEHOLD EXPENSES ────────────────────────────────────────
export const EXPENSES_CONFIG = [
  {
    id:          'food',
    labelKey:    'expense.food',
    cost:        GAME_CONSTANTS.COST_FOOD,
    icon:        '◈',
    required:    true,
    consequenceKey: 'expense.foodConseq',
  },
  {
    id:          'heat',
    labelKey:    'expense.heat',
    cost:        GAME_CONSTANTS.COST_HEAT,
    icon:        '◉',
    required:    true,
    consequenceKey: 'expense.heatConseq',
  },
  {
    id:          'medicine',
    labelKey:    'expense.medicine',
    cost:        GAME_CONSTANTS.COST_MEDICINE,
    icon:        '✚',
    required:    false,
    consequenceKey: 'expense.medConseq',
  },
];

// ── HEALTH STATE LADDER ───────────────────────────────────────
export const HEALTH_STATES = ['healthy', 'hungry', 'cold', 'sick', 'critical', 'dead'];

// ── FACTORY ───────────────────────────────────────────────────

/**
 * Create and return a fresh GameState object.
 * All mutable values are initialised to their defaults.
 * Nothing is shared between instances.
 *
 * @returns {GameStateShape}
 */
export function createGameState() {
  return {
    // ── Shift metadata
    day:          1,
    time:         8 * 60,       // minutes since midnight (08:00)
    dayActive:    false,

    // ── Passenger queue
    passengers:   [],           // array of passenger objects
    currentIndex: 0,
    current:      null,         // passenger currently at window
    decisions:    [],           // { id, decision, correct, scoreChange, passenger }

    // ── Economy
    money:        0,
    errors:       0,
    processed:    0,
    warnings:     0,            // supervisor warnings this shift

    // ── Scoring
    score: {
      total:      0,
      streak:     0,            // consecutive correct decisions
      bestStreak: 0,
    },

    // ── Moral profile (mirrors StoryState but tracked here for HUD)
    moral: {
      compassion:           0,
      loyalty:              0,
      corruption:           0,
      animusAlignment:      50, // 0–100; >60 = allied, <20 = rejected
      animusTasksFollowed:  0,
    },

    // ── Family
    family: {
      members:    FAMILY_DEFAULTS.map(m => ({ ...m })),
      foodPaid:   true,
      heatPaid:   true,
      missedFood: 0,            // consecutive days food was unpaid
      missedHeat: 0,            // consecutive days heat was unpaid
    },

    // ── Optional flags set by systems at runtime
    animusSymbolBoost: false,
    conditionalNews:   null,
    conditionalPenalty:null,
  };
}

// ── SINGLETON (used by legacy game.js layer) ──────────────────
/**
 * The singleton state object used throughout the game.
 * Import this directly in new modules; use window.GameState
 * in legacy modules (patched via install()).
 */
export const GameState = createGameState();

// ── SERIALISATION HELPERS ─────────────────────────────────────

/**
 * Produce a plain-object snapshot suitable for JSON serialisation.
 * @param {GameStateShape} gs
 * @returns {object}
 */
export function serialise(gs) {
  return {
    day:       gs.day,
    money:     gs.money,
    errors:    gs.errors,
    processed: gs.processed,
    warnings:  gs.warnings,
    score:     { ...gs.score },
    moral:     { ...gs.moral },
    family: {
      members:    gs.family.members.map(m => ({ ...m })),
      foodPaid:   gs.family.foodPaid,
      heatPaid:   gs.family.heatPaid,
      missedFood: gs.family.missedFood,
      missedHeat: gs.family.missedHeat,
    },
  };
}

/**
 * Restore a GameState from a serialised snapshot (from localStorage).
 * Mutates `gs` in place; returns it for chaining.
 * @param {GameStateShape} gs
 * @param {object}         snapshot  — previously produced by serialise()
 * @returns {GameStateShape}
 */
export function hydrate(gs, snapshot) {
  if (!snapshot) return gs;
  gs.day       = snapshot.day       ?? gs.day;
  gs.money     = snapshot.money     ?? gs.money;
  gs.errors    = snapshot.errors    ?? gs.errors;
  gs.processed = snapshot.processed ?? gs.processed;
  gs.warnings  = snapshot.warnings  ?? gs.warnings;
  if (snapshot.score)  Object.assign(gs.score,  snapshot.score);
  if (snapshot.moral)  Object.assign(gs.moral,  snapshot.moral);
  if (snapshot.family) {
    gs.family.members    = (snapshot.family.members || []).map(m => ({ ...m }));
    gs.family.foodPaid   = snapshot.family.foodPaid   ?? true;
    gs.family.heatPaid   = snapshot.family.heatPaid   ?? true;
    gs.family.missedFood = snapshot.family.missedFood ?? 0;
    gs.family.missedHeat = snapshot.family.missedHeat ?? 0;
  }
  return gs;
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Expose the GameState singleton on window so that legacy files
 * (game.js, ui.js …) that reference window.GameState continue to work.
 *
 * Call once during app bootstrap BEFORE the legacy scripts run,
 * OR after, in which case the legacy GameState object is replaced
 * with this module's singleton.
 *
 * @param {GameStateShape} [gs]  defaults to the module singleton
 */
export function install(gs = GameState) {
  window.GameState = gs;
  console.log('[GameState] Installed on window.GameState');
  return gs;
}
