/* ================================================================
   CHECKPOINT — RuleEngine
   Pure logic module. Zero DOM, zero side-effects.

   Extracted from game.js (determineCorrectDecision) and
   story.js (getRulesForDay / RULEBOOK).

   Exports:
     getRulesForDay(day)                       → rules object
     determineCorrectDecision(anomalies, nation, dayState) → decision string
     install()                                 → patches window.*
================================================================ */

import { RULEBOOK } from '../data/rulebook.js';

// ── RULE LOOKUP ───────────────────────────────────────────────

/**
 * Return the rules object that applies on a given day.
 * Walks back from `day` to find the most recent RULEBOOK entry.
 *
 * @param {number} day
 * @returns {object}
 */
export function getRulesForDay(day) {
  for (let d = day; d >= 1; d--) {
    if (RULEBOOK[d]) return RULEBOOK[d];
  }
  return RULEBOOK[1];
}

// ── DECISION ENGINE ───────────────────────────────────────────

/**
 * Given an array of anomalies, the passenger's nation, and the
 * current dayState, return the correct border decision.
 *
 * @param {Array}  anomalies  — anomaly objects from PassengerSystem
 * @param {string} nation     — 3-letter ISO code, e.g. 'TUR'
 * @param {object} dayState   — must have at least { day: number }
 * @returns {'approve'|'deny'|'detain'|'flag'}
 */
export function determineCorrectDecision(anomalies, nation, dayState) {
  const rules = getRulesForDay(dayState.day);

  // Banned nation — hard deny
  if (rules.bannedNations && rules.bannedNations.includes(nation)) return 'deny';

  // Nation not yet in the permitted list
  if (rules.nations !== 'all' && !rules.nations.includes(nation)) return 'deny';

  // Interpol watchlist hit — detain (always, regardless of day)
  const watchlist = anomalies.find(a => a.type === 'watchlist_hit');
  if (watchlist) return 'detain';

  // EES overstay — detain when rule mandates it, otherwise deny
  const overstay = anomalies.find(a => a.type === 'ees_overstay');
  if (overstay) return rules.overstayDetain ? 'detain' : 'deny';

  // No anomalies → approve
  if (!anomalies.length) return 'approve';

  // Severity-based fallthrough
  if (anomalies.some(a => a.severity === 'critical')) return 'detain';
  if (anomalies.some(a => a.severity === 'high'))     return 'deny';

  // Medium/low anomalies only → deny (border errs on the side of caution)
  return 'deny';
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.* globals so that legacy game.js / story.js callers
 * continue to work unchanged.
 */
export function install() {
  if (typeof window === 'undefined') return;
  window.getRulesForDay            = getRulesForDay;
  window.determineCorrectDecision  = determineCorrectDecision;
  window.RULEBOOK                  = RULEBOOK;
  console.log('[RuleEngine] Installed.');
}
