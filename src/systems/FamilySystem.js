/* ================================================================
   CHECKPOINT — FamilySystem
   Pure logic module. Zero DOM, zero side-effects.

   Handles the household economy and family health state machine.
   Health ladder: healthy → hungry / cold → sick → critical → dead

   Extracted from game.js: applyDayConsequences(), needsMedicine(),
   getFamilyMemberCount().

   Exports:
     applyDayConsequences(gs, paid)   → void  (mutates gs.family)
     needsMedicine(gs)                → boolean
     getFamilyMemberCount(gs)         → number
     getHealthSummary(gs)             → { member, health }[]
     install()                        → patches window.*
================================================================ */

import { HEALTH_STATES } from '../core/GameState.js';

// ── DAY CONSEQUENCE ENGINE ────────────────────────────────────

/**
 * Apply end-of-day expense consequences to the family.
 * Mutates gs.family in place. No return value.
 *
 * Health state machine (per member, per day):
 *   healthy  + no food/heat → hungry or cold
 *   hungry   + no food      → sick (sickDays = 1)
 *   cold     + no heat      → sick (sickDays = 1)
 *   hungry/cold + paid      → healthy (recovered)
 *   sick     + no medicine  → critical (after 2 sick days)
 *   sick     + medicine     → healthy (recovered)
 *   critical + no medicine  → dead
 *   critical + medicine     → sick
 *
 * @param {object} gs    — GameState
 * @param {object} paid  — { food: boolean, heat: boolean, medicine: boolean }
 */
export function applyDayConsequences(gs, paid) {
  const fam = gs.family;

  fam.foodPaid = !!paid.food;
  fam.heatPaid = !!paid.heat;

  if (!paid.food) fam.missedFood++;
  else            fam.missedFood = 0;

  if (!paid.heat) fam.missedHeat++;
  else            fam.missedHeat = 0;

  fam.members.forEach(m => {
    if (!m.alive) return;

    const hungry = !paid.food;
    const cold   = !paid.heat;

    switch (m.health) {
      case 'healthy':
        if (hungry || cold) m.health = hungry ? 'hungry' : 'cold';
        break;

      case 'hungry':
        if (hungry) { m.health = 'sick'; m.sickDays = 1; }
        else          m.health = 'healthy';
        break;

      case 'cold':
        if (cold) { m.health = 'sick'; m.sickDays = 1; }
        else        m.health = 'healthy';
        break;

      case 'sick':
        m.sickDays++;
        if (!paid.medicine) {
          if (m.sickDays >= 2) m.health = 'critical';
        } else {
          m.health = 'healthy';
          m.sickDays = 0;
        }
        break;

      case 'critical':
        if (!paid.medicine) { m.health = 'dead'; m.alive = false; }
        else                  m.health = 'sick';
        break;

      default:
        break;
    }
  });
}

// ── QUERIES ───────────────────────────────────────────────────

/**
 * Returns true if any living family member needs medicine
 * (is sick or critical).
 *
 * @param {object} gs
 * @returns {boolean}
 */
export function needsMedicine(gs) {
  return gs.family.members.some(m => m.alive && (m.health === 'sick' || m.health === 'critical'));
}

/**
 * Returns the count of living family members.
 *
 * @param {object} gs
 * @returns {number}
 */
export function getFamilyMemberCount(gs) {
  return gs.family.members.filter(m => m.alive).length;
}

/**
 * Returns a flat summary of every member's current health state.
 *
 * @param {object} gs
 * @returns {{ id: string, name: string, relation: string, health: string, alive: boolean }[]}
 */
export function getHealthSummary(gs) {
  return gs.family.members.map(({ id, name, relation, health, alive }) => ({
    id, name, relation, health, alive,
  }));
}

/**
 * Returns the numeric index of a health state in the ladder,
 * useful for comparing severity.
 * healthy=0, hungry=1, cold=2, sick=3, critical=4, dead=5
 *
 * @param {string} health
 * @returns {number}
 */
export function healthSeverity(health) {
  const idx = HEALTH_STATES.indexOf(health);
  return idx === -1 ? 0 : idx;
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.* globals so legacy game.js callers continue to work.
 * The legacy applyDayConsequences() reads from window.GameState, so
 * we wrap accordingly.
 */
export function install() {
  if (typeof window === 'undefined') return;
  window.needsMedicine        = () => needsMedicine(window.GameState);
  window.getFamilyMemberCount = () => getFamilyMemberCount(window.GameState);
  window.getHealthSummary     = () => getHealthSummary(window.GameState);
  // applyDayConsequences is more complex — keep game.js version for now;
  // new code should call the exported function directly with a gs argument.
  console.log('[FamilySystem] Installed.');
}
