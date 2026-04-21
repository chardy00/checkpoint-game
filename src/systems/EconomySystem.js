/* ================================================================
   CHECKPOINT — EconomySystem
   Pure logic module. Zero DOM, zero side-effects.

   Handles all scoring, money, and moral-tracking calculations
   that happen when the player makes a border decision.

   Extracted from game.js: recordDecision(), score constants,
   money mutation, moral tracking.

   Exports:
     calculateScoreChange(decision, passenger, streak, moralMods)
     applyDecision(gs, decision)   → { correct, scoreChange, passenger }
     install()                     → patches window.*
================================================================ */

import { SCORE_TABLE, GAME_CONSTANTS } from '../core/GameState.js';

// ── SCORE CALCULATION ─────────────────────────────────────────

/**
 * Calculate the score delta for a single decision without mutating
 * any state.
 *
 * @param {string}  decision     — 'approve' | 'deny' | 'detain' | 'flag'
 * @param {object}  passenger    — passenger object (needs .correctDecision, .anomalies)
 * @param {number}  streak       — current consecutive-correct streak (before this decision)
 * @param {object}  [moralMods]  — from getMoralityModifiers(); optional
 * @returns {{ scoreChange: number, correct: boolean }}
 */
export function calculateScoreChange(decision, passenger, streak, moralMods = {}) {
  const correct = decision === passenger.correctDecision;
  let scoreChange = 0;

  if (correct) {
    const key = `CORRECT_${decision.toUpperCase()}`;
    scoreChange = SCORE_TABLE[key] ?? SCORE_TABLE.CORRECT_APPROVE;

    // Streak bonus: +3 for 3+ consecutive correct decisions
    if (streak + 1 >= 3) scoreChange += 3;

    // Loyalty salary bonus
    if (moralMods.loyaltyBonus) scoreChange += 2;
  } else {
    const key = `WRONG_${decision.toUpperCase()}`;
    scoreChange = SCORE_TABLE[key] ?? SCORE_TABLE.WRONG_APPROVE;
  }

  // Terrorist special scoring (stacks on top of base score)
  const isTerrorist = passenger.anomalies && passenger.anomalies.some(a => a.type === 'terrorist');
  if (isTerrorist && decision === 'detain') scoreChange += SCORE_TABLE.TERRORIST_CAUGHT;
  if (isTerrorist && decision === 'approve') scoreChange += SCORE_TABLE.TERRORIST_MISSED;

  return { scoreChange, correct };
}

// ── MORAL TRACKING ────────────────────────────────────────────

/**
 * Update the moral profile inside `gs` for one decision.
 * Mutates gs.moral in place. No return value.
 *
 * @param {object} gs         — GameState
 * @param {string} decision
 * @param {object} passenger
 */
export function applyMoralTracking(gs, decision, passenger) {
  const anomalies = passenger.anomalies || [];

  // Compassion: letting someone with problems through
  if (decision === 'approve' && anomalies.length > 0) gs.moral.compassion++;

  // Loyalty: denying a clean traveller (strict adherence)
  if (decision === 'deny' && anomalies.length === 0) gs.moral.loyalty++;

  // Loyalty bonus: detaining a watchlist suspect
  if (decision === 'detain' && anomalies.some(a => a.type === 'watchlist_hit')) gs.moral.loyalty += 2;
}

// ── DECISION APPLICATION ──────────────────────────────────────

/**
 * Apply a player decision to the game state.
 * Mutates gs in place (score, money, errors, warnings, processed,
 * decisions array, moral profile).
 *
 * Does NOT touch the DOM — call updateHUD() separately.
 *
 * @param {object} gs        — GameState
 * @param {string} decision  — 'approve' | 'deny' | 'detain' | 'flag'
 * @returns {{ correct: boolean, scoreChange: number, passenger: object }}
 */
export function applyDecision(gs, decision) {
  const p = gs.current;
  if (!p) return null;

  // Gather morality modifiers from story layer (if available)
  const moralMods = (typeof window !== 'undefined' && typeof window.getMoralityModifiers === 'function')
    ? window.getMoralityModifiers()
    : {};

  const { scoreChange, correct } = calculateScoreChange(decision, p, gs.score.streak, moralMods);

  // ── Update streak
  if (correct) {
    gs.score.streak++;
    if (gs.score.streak > gs.score.bestStreak) gs.score.bestStreak = gs.score.streak;
  } else {
    gs.score.streak = 0;
    gs.errors++;
    gs.warnings++;
  }

  // ── Update score & money
  gs.score.total += scoreChange;
  gs.money = Math.max(0, gs.money + (correct
    ? GAME_CONSTANTS.SALARY_PER_CORRECT
    : -GAME_CONSTANTS.PENALTY_PER_MISTAKE));
  gs.processed++;

  // ── Record decision
  gs.decisions.push({ id: p.id, decision, correct, scoreChange, passenger: p });

  // ── Moral tracking
  applyMoralTracking(gs, decision, p);

  return { correct, scoreChange, passenger: p };
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.* globals so legacy game.js callers continue to work.
 * Note: recordDecision in game.js is still bound to game.js's own
 * GameState; this install only exposes the pure helpers for new code.
 */
export function install() {
  if (typeof window === 'undefined') return;
  window.calculateScoreChange = calculateScoreChange;
  window.applyMoralTracking   = applyMoralTracking;
  window.applyDecision        = applyDecision;
  console.log('[EconomySystem] Installed.');
}
