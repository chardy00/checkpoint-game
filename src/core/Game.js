/* ================================================================
   CHECKPOINT — Game
   Orchestration layer. Zero DOM. Zero side-effects (all callbacks
   are injected via options).

   Coordinates the system modules to run one shift:
     startDay()        → generate passengers, inject story chars
     nextPassenger()   → advance queue, return current passenger
     processDecision() → score + economy + story consequences
     endDay()          → mark shift closed, fire onDayEnd callback

   Constructor:
     new Game(gameState, systems, options)

     gameState  — createGameState() object
     systems    — { passenger, economy, family, timeline, story? }
     options    — { onHUDUpdate, onDayEnd, onSave, localization? }

   All DOM interaction is delegated through options callbacks so
   this class remains headless and unit-testable.
================================================================ */

import { GAME_CONSTANTS } from './GameState.js';

export class Game {

  /**
   * @param {object} gameState  — createGameState() shape
   * @param {object} systems    — injected system modules
   * @param {object} [options]  — callbacks + localization
   */
  constructor(gameState, systems = {}, options = {}) {
    this.gs  = gameState;
    this.sys = systems;
    this.opt = options;
  }

  // ── SHIFT START ───────────────────────────────────────────────

  /**
   * Begin a new shift for the current day.
   * Generates the passenger queue, injects story characters,
   * resets per-shift counters.
   */
  startDay() {
    const gs  = this.gs;
    const sys = this.sys;

    // Generate random passengers
    const count = rand(5, 8);
    gs.passengers = [];
    if (sys.passenger && sys.passenger.resetPassengerCounter) {
      sys.passenger.resetPassengerCounter();
    }

    for (let i = 0; i < count; i++) {
      if (sys.passenger && sys.passenger.generatePassenger) {
        gs.passengers.push(sys.passenger.generatePassenger(gs.day, gs));
      }
    }

    // Inject story / ANIMUS / PHANTOM passengers
    const inject = sys.story?.injectStoryPassengers
      ?? (typeof window !== 'undefined' ? window.injectStoryPassengers : null);
    if (typeof inject === 'function') {
      gs.passengers = inject(gs.day, gs.passengers);
    }

    // Reset shift state
    gs.currentIndex = 0;
    gs.current      = null;
    gs.dayActive    = true;
    gs.time         = 8 * 60;
    gs.errors       = 0;
    gs.warnings     = 0;
    gs.processed    = 0;
    gs.decisions    = [];

    // Check conditional timeline events
    const tl = sys.timeline;
    if (tl && typeof tl.checkConditionalEvents === 'function') {
      const ss = sys.story?.getStoryState?.()
        ?? (typeof window !== 'undefined' ? window.StoryState : null);
      tl.checkConditionalEvents(gs.day, gs, ss);
    }

    this._hudUpdate();
  }

  // ── PASSENGER QUEUE ───────────────────────────────────────────

  /**
   * Advance to the next passenger in the queue.
   * Returns null and triggers endDay() when the queue is exhausted.
   *
   * @returns {object|null}  current passenger object, or null
   */
  nextPassenger() {
    const gs = this.gs;

    if (gs.currentIndex >= gs.passengers.length) {
      this.endDay();
      return null;
    }

    const p = gs.passengers[gs.currentIndex];
    gs.current      = p;
    gs.currentIndex++;
    gs.time        += GAME_CONSTANTS.TIME_PER_PASSENGER / 60;

    this._hudUpdate();
    return p;
  }

  // ── DECISION ──────────────────────────────────────────────────

  /**
   * Apply the player's decision for the current passenger.
   * Delegates scoring / money / moral updates to EconomySystem.
   * Triggers HUD refresh and autosave.
   *
   * @param {string} decision — 'approve' | 'deny' | 'detain' | 'flag'
   * @returns {{ correct: boolean, scoreChange: number, passenger: object } | null}
   */
  processDecision(decision) {
    const gs  = this.gs;
    if (!gs.current) return null;

    let result;

    if (this.sys.economy && typeof this.sys.economy.applyDecision === 'function') {
      result = this.sys.economy.applyDecision(gs, decision);
    } else {
      // Fallback: bare-minimum inline scoring (keeps game alive without EconomySystem)
      const p       = gs.current;
      const correct = decision === p.correctDecision;
      const delta   = correct ? GAME_CONSTANTS.SALARY_PER_CORRECT : -GAME_CONSTANTS.PENALTY_PER_MISTAKE;
      gs.score.total += correct ? 10 : -5;
      gs.money        = Math.max(0, gs.money + delta);
      gs.processed++;
      if (!correct) { gs.errors++; gs.warnings++; }
      gs.decisions.push({ id: p.id, decision, correct, scoreChange: delta, passenger: p });
      result = { correct, scoreChange: delta, passenger: p };
    }

    this._hudUpdate();
    this._save();
    return result;
  }

  // ── DAY END ───────────────────────────────────────────────────

  /**
   * Close the current shift.
   * Marks dayActive = false and calls the onDayEnd callback if provided.
   */
  endDay() {
    this.gs.dayActive = false;

    if (typeof this.opt.onDayEnd === 'function') {
      this.opt.onDayEnd(this.gs);
    }
  }

  // ── EXPENSE APPLICATION ───────────────────────────────────────

  /**
   * Apply end-of-day household expenses.
   * Delegates to FamilySystem if available.
   *
   * @param {{ food: boolean, heat: boolean, medicine: boolean }} paid
   */
  applyExpenses(paid) {
    if (this.sys.family && typeof this.sys.family.applyDayConsequences === 'function') {
      this.sys.family.applyDayConsequences(this.gs, paid);
    }
    this.gs.day++;
    this._save();
  }

  // ── PRIVATE HELPERS ───────────────────────────────────────────

  _hudUpdate() {
    if (typeof this.opt.onHUDUpdate === 'function') {
      this.opt.onHUDUpdate(this.gs);
    }
  }

  _save() {
    if (typeof this.opt.onSave === 'function') {
      this.opt.onSave(this.gs);
    } else if (typeof window !== 'undefined' && typeof window.saveGame === 'function') {
      window.saveGame();
    }
  }
}

// ── INSTALL ───────────────────────────────────────────────────

/**
 * Create a Game instance wired to the legacy window.* globals and
 * expose it as window.Game for backward compatibility.
 *
 * @param {object} gameState
 * @param {object} systems
 * @param {object} options
 * @returns {Game}
 */
export function install(gameState, systems = {}, options = {}) {
  if (typeof window === 'undefined') return new Game(gameState, systems, options);
  const g = new Game(gameState, systems, options);
  window.Game = g;
  console.log('[Game] Installed.');
  return g;
}

// ── UTILS (private to this module) ────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
