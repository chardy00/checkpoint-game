/* ================================================================
   CHECKPOINT — StorySystem
   Pure logic module. Zero DOM, zero side-effects.

   Owns the StoryState shape and the morality modifier query.
   Character dialogue, PHANTOM tasks, and ending conditions remain
   in story.js (too many closures over StoryState to safely
   extract atomically — planned for a later deep-refactor pass).

   This module provides:
     - createStoryState() factory — canonical state shape
     - getMoralityModifiers(ss)   — pure query, no side-effects
     - install()                  — patches window.StoryState

   Exports:
     createStoryState()
     getMoralityModifiers(ss)
     install()
================================================================ */

import { createAnimusState } from './AnimusSystem.js';

// ── STATE FACTORY ─────────────────────────────────────────────

/**
 * Create and return a fresh StoryState object.
 * All mutable values are initialised to their defaults.
 * Nothing is shared between instances.
 *
 * @returns {StoryStateShape}
 */
export function createStoryState() {
  return {
    // Character memory — each array records per-appearance decisions
    memory: {
      vito:  [], amara: [], reznik: [], mara: [],
      elias: [], mirko: [], lila:   [],
    },

    // PHANTOM faction state
    phantom: {
      trust:     0,
      contacted: false,
      revealed:  false,
      accepted:  0,
      refused:   0,
      tasks:     [],   // { taskId, accepted, completed }
    },

    // ANIMUS faction state (delegated to AnimusSystem shape)
    animus: createAnimusState(),

    // Moral axes
    compassion: 0,
    loyalty:    0,
    corruption: 0,

    // Boolean story flags
    flags: {
      amaraSavedAnton:   false,
      eliasArrested:     false,
      eliasTrusted:      false,
      mirkoCollapsed:    false,
      mirkoApproved:     false,
      reznikWarned:      false,
      reznikBribed:      false,
      phantomContacted:  false,
      vitoGift:          false,
      escapePossible:    false,
      terrAttackDay8:    false,
      lilaDeceased:      false,
      lilaEscaped:       false,
      briberAccepted:    false,
      task1Accepted:     false,
      task2Accepted:     false,
      task3Accepted:     false,
      task4Accepted:     false,
      task1Resolved:     false,
      task2Resolved:     false,
      task4Resolved:     false,
      vitoAlive:         true,
      cryingFamilyDenied: false,
      diplomaticIncident: false,
      // ANIMUS flags (mirrored here for quick conditional checks)
      animusTask1Done:   false,
      animusTask2Done:   false,
      animusTask3Done:   false,
      animusTask4Done:   false,
      animusAllBlind:    false,  // followed all 4 tasks without questioning
      animusRejected:    false,  // alignment ≤ 10 by Day 15
    },

    // Per-day dialogue choices: 'charId_day' → choiceKey
    dayDialogues: {},

    // Bribe tracking
    bribes: { offered: 0, accepted: 0, refused: 0 },
  };
}

// ── MORALITY MODIFIERS ────────────────────────────────────────

/**
 * Compute gameplay modifiers derived from the current moral profile.
 * Pure function — does not mutate ss.
 *
 * @param {object} ss  — StoryState (createStoryState() shape)
 * @returns {object}
 */
export function getMoralityModifiers(ss) {
  return {
    // High compassion: supervisor occasionally overlooks single errors
    compassionBuffer: ss.compassion >= 60,
    // High loyalty: bonus salary on clean decision streaks
    loyaltyBonus: ss.loyalty >= 50,
    // High corruption: bribe offers increase, Reznik tracks you
    corruptionWatched: ss.corruption >= 40,
    // PHANTOM trust: they intervene if you're in danger
    phantomProtects: ss.phantom.trust >= 60,
    // Narrative label used in ending selection
    description:
      ss.loyalty > ss.corruption && ss.loyalty > ss.compassion   ? 'loyal'
      : ss.compassion > ss.loyalty && ss.compassion > ss.corruption ? 'compassionate'
      : ss.corruption > 40                                           ? 'corrupt'
      : 'balanced',
  };
}

// ── SINGLETON ─────────────────────────────────────────────────

/**
 * The singleton StoryState used by legacy code via window.StoryState.
 * New code should import createStoryState() and maintain its own instance.
 */
export const StoryState = createStoryState();

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.* globals so that legacy story.js callers work unchanged.
 * story.js already sets window.StoryState from its own const — calling
 * install() AFTER story.js loads will override it with this module's
 * singleton, which starts with the same shape.
 *
 * During the transition, story.js's StoryState remains authoritative;
 * install() should be called BEFORE story.js, or not called at all
 * until story.js is fully replaced.
 *
 * @param {StoryStateShape} [ss]  defaults to the module singleton
 */
export function install(ss = StoryState) {
  if (typeof window === 'undefined') return;
  window.StoryState = ss;
  window.getMoralityModifiers = () => getMoralityModifiers(ss);
  console.log('[StorySystem] Installed.');
}
