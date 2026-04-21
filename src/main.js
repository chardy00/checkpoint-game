/* ================================================================
   CHECKPOINT — src/main.js
   Application entry point.

   Boot sequence:
     1. LocalizationManager  — i18n ready, window.t patched
     2. GameState            — singleton installed on window
     3. Systems              — RuleEngine, PassengerSystem,
                               EconomySystem, FamilySystem,
                               TimelineSystem, AnimusSystem,
                               StorySystem
     4. UI modules           — AnimationController, ModalManager,
                               UIManager
     5. Game orchestrator    — wired up, callbacks set
     6. Legacy scripts       — lang.js → game.js → story.js →
                               timeline.js → … load normally
                               via <script> tags in index.html;
                               they inherit window.* patches made
                               in steps 1–5.

   This module is loaded as <script type="module"> BEFORE the
   legacy <script> tags. Because ES modules are deferred by
   default, and legacy scripts run in document order, the
   import() chain below runs AFTER the DOM is parsed but
   BEFORE the legacy scripts finish executing.

   Strategy during migration:
   - New code uses the ES module imports directly.
   - Legacy code continues to use window.* globals patched here.
   - Once a legacy file is fully replaced, remove it from
     index.html and delete the install() call here.
================================================================ */

import { LocalizationManager } from './i18n/LocalizationManager.js';
import { GameState, install as installGameState } from './core/GameState.js';
import { Game }                from './core/Game.js';

// Systems
import { install as installRuleEngine }    from './systems/RuleEngine.js';
import { install as installPassengerSys }  from './systems/PassengerSystem.js';
import { install as installEconomy }       from './systems/EconomySystem.js';
import { install as installFamily }        from './systems/FamilySystem.js';
import { install as installTimeline }      from './systems/TimelineSystem.js';
import { install as installAnimus }        from './systems/AnimusSystem.js';
import { install as installStory }         from './systems/StorySystem.js';

// UI
import { install as installAnimations }   from './ui/AnimationController.js';
import { install as installModals }        from './ui/ModalManager.js';
import { install as installUIManager }     from './ui/UIManager.js';

// Direct references for Game wiring
import { generatePassenger, resetPassengerCounter } from './systems/PassengerSystem.js';
import { applyDecision }                            from './systems/EconomySystem.js';
import { applyDayConsequences }                     from './systems/FamilySystem.js';
import { getDayConfig, checkConditionalEvents }     from './systems/TimelineSystem.js';
import { updateHUD }                                from './ui/UIManager.js';
import { showDayBulletin }                          from './ui/ModalManager.js';
import { triggerDecisionFeedback, attachButtonRipples } from './ui/AnimationController.js';

// ── 1. LOCALISATION ───────────────────────────────────────────

const localization = new LocalizationManager('en');
localization.loadSavedLanguage();
LocalizationManager.install(localization);   // patches window.t, window.bi, etc.

// ── 2. GAME STATE ─────────────────────────────────────────────

installGameState(GameState);  // patches window.GameState

// Load persisted save if present
(function loadSave() {
  try {
    const raw  = localStorage.getItem('chk_save');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.gs) {
      import('./core/GameState.js').then(({ hydrate }) => hydrate(GameState, data.gs));
    }
  } catch (_) {}
})();

// ── 3. SYSTEMS ────────────────────────────────────────────────

installRuleEngine();     // window.getRulesForDay, window.RULEBOOK
installPassengerSys();   // window._generatePassenger, window._genMRZ
installEconomy();        // window.calculateScoreChange, window.applyDecision
installFamily();         // window.needsMedicine, window.getFamilyMemberCount
installTimeline();       // window.Timeline
installAnimus();         // window.ANIMUS_MESSAGES, window.recordAnimusTask
installStory();          // window.StoryState, window.getMoralityModifiers

// ── 4. UI ─────────────────────────────────────────────────────

installAnimations();     // window.triggerGlitch, window.triggerMoneyTick, …
installModals();         // window.showModal, window.showDayBulletin, …
installUIManager();      // window.updateHUD, window.renderQueue, …

// ── 5. GAME ORCHESTRATOR ──────────────────────────────────────

const game = new Game(
  GameState,
  {
    passenger: { generatePassenger, resetPassengerCounter },
    economy:   { applyDecision },
    family:    { applyDayConsequences },
    timeline:  { getDayConfig, checkConditionalEvents },
  },
  {
    onHUDUpdate: (gs) => updateHUD(gs),

    onDayEnd: (gs) => {
      // Legacy showDaySummary is still in ui.js — call via window
      if (typeof window.showDaySummary === 'function') window.showDaySummary();
    },

    onSave: (gs) => {
      if (typeof window.saveGame === 'function') window.saveGame();
    },
  }
);

// Expose Game instance for legacy ui.js calls
window.Game           = game;
window.startDay       = () => game.startDay();
window.nextPassenger  = () => game.nextPassenger();
window.recordDecision = (decision) => {
  const result = game.processDecision(decision);
  if (result) {
    // Decision feedback on the action bar
    triggerDecisionFeedback('action-info', result.correct);
  }
  return result;
};

// Attach ripples once DOM is ready (module scripts are deferred)
attachButtonRipples();

// ── 6. APPLY I18N TO DOM ──────────────────────────────────────
// Runs after DOM is ready (module scripts are deferred)

localization.applyI18n();

console.log('[CHECKPOINT] main.js bootstrapped. Day:', GameState.day,
            '| Lang:', localization.getCurrentLanguage());
