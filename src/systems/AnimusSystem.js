/* ================================================================
   CHECKPOINT — AnimusSystem
   Pure logic module. Zero DOM, zero side-effects (except deferred
   window.triggerGlitch calls which are guarded).

   Handles the ANIMUS faction: hidden messages, passenger tasks,
   alignment tracking, and glitch effects.

   Extracted from story.js: ANIMUS_MESSAGES, ANIMUS_PASSENGERS,
   buildAnimusPassenger(), triggerAnimusGlitchForDay(),
   getAnimusMessageForDay(), recordAnimusTask().

   Exports:
     ANIMUS_MESSAGES                         — message map by day
     ANIMUS_PASSENGERS                       — passenger definitions
     createAnimusState()                     → fresh animus sub-state
     getAnimusMessageForDay(day, animusState) → message obj | null
     recordAnimusTask(animusState, taskId, followed) → void
     triggerAnimusGlitchForDay(day)          → void (deferred DOM)
     install()                               → patches window.*
================================================================ */

// ── ANIMUS MESSAGES ───────────────────────────────────────────

/**
 * Messages keyed by day they are first shown.
 * onShow receives (animusState) and may mutate it.
 * isTask / taskId mark actionable messages.
 */
export const ANIMUS_MESSAGES = {
  4: {
    text: 'You see more than they believe you see.\n\nWe have been watching for sixteen days.\nYou are not what they hired.\n\n◈',
    onShow: (as) => { as.contacted = true; },
  },
  6: {
    text: 'The man with badge 4471 is not an auditor.\nHe is a counter-intelligence asset.\nThey send him after officers who notice things.\n\nYou noticed things.\n\n◈',
    onShow: () => {},
  },
  8: {
    text: 'Day 8. Someone upstream altered a record tonight.\nPassenger 341 — the Syrian family.\nThe file says DENIED. The stamp was yours.\n\nBut you do not remember denying them.\n\nDo you?\n\n◈',
    onShow: (as) => { as.alignment = Math.max(0, as.alignment - 3); },
  },
  10: {
    text: 'There is a man in this building.\nHe controls which flags the system shows you.\nNot all anomalies are real.\nNot all clear flags are clear.\n\nThink about who benefits from your decisions.\n\n◈',
    onShow: () => {},
  },
  12: {
    text: 'Tomorrow: a woman named SARA KHALID will cross.\nHer papers will be in order. Let her through.\nDo not ask why.\nDo not note the ◈ on the inside cover of her passport.\n\nIf you cannot help her, we understand.\nBut she is carrying something we need on the other side.\n\n◈',
    isTask: true, taskId: 'animus_task_1',
    onShow: () => {},
  },
  14: {
    text: 'You let her through. Or you did not.\nEither way — you are still reading this.\n\nThat is enough for now.\n\n◈',
    onShow: (as, followed) => {
      if (followed) as.alignment = Math.min(100, as.alignment + 10);
    },
  },
  16: {
    text: 'The checkpoint logs are reviewed every Thursday.\nSomeone on the review board has been altering approval rates.\nThey need a 12% denial rate to keep their numbers.\n\nYou are their instrument.\n\nFor the next three passengers: approve anyone with clean papers.\nDo not manufacture reasons to deny.\n\n◈',
    isTask: true, taskId: 'animus_task_2',
    onShow: () => {},
  },
  18: {
    text: 'Last task.\n\nPassenger with initials E.B. will cross.\nHis record shows a prior overstay.\nThe overstay was fabricated. The record was planted.\n\nYou can approve him anyway.\nOr you can follow the record.\n\nWe will not tell you what to do.\nWe only tell you what is true.\n\n◈',
    isTask: true, taskId: 'animus_task_3',
    onShow: () => {},
  },
  20: {
    text: 'You are still here.\n\nSo are we.\n\nWhat you know, what you have seen — it does not disappear when the shift ends.\nNeither do we.\n\nWhen you are ready:\n    There is a door at the back of Gate 7.\n    It is never locked at 02:00.\n\nYou do not have to do anything.\nYou only have to decide what kind of person looks back at you in the morning.\n\n— ANİMUS\n◈',
    onShow: (as) => { as.alignment = Math.min(100, as.alignment + 5); },
  },
};

// ── ANIMUS PASSENGERS ─────────────────────────────────────────

export const ANIMUS_PASSENGERS = {
  sara_khalid: {
    day: 13,
    firstName: 'Sara', lastName: 'Khalid',
    nation: 'SYR', sex: 'F',
    dob: '1991.03.22', height: 162, weight: 55, issueCity: 'Damascus',
    passportNumber: 'SYR-◈-9917', expiry: '2028.06.01',
    anomalies: [],
    behavior: 'Calm. Eyes forward. Does not volunteer information.',
    correctDecision: 'approve',
    animusNote: true,
  },
};

// ── STATE FACTORY ─────────────────────────────────────────────

/**
 * Create and return a fresh ANIMUS sub-state object.
 * Embed this inside StoryState as `storyState.animus`.
 */
export function createAnimusState() {
  return {
    alignment:      50,    // 0–100. >65 = allied, <10 = rejected
    tasksFollowed:  0,
    contacted:      false,
    messagesShown:  [],    // day numbers of shown messages
    tasksCompleted: [],    // task ids completed
    symbolShown:    false,
  };
}

// ── MESSAGE QUERY ─────────────────────────────────────────────

/**
 * Return the ANIMUS message for the given day, or null if none / already shown.
 * Does NOT mutate animusState — caller must call msg.onShow(animusState) explicitly.
 *
 * @param {number} day
 * @param {object} animusState — createAnimusState() shape
 * @returns {object|null}
 */
export function getAnimusMessageForDay(day, animusState) {
  const msg = ANIMUS_MESSAGES[day];
  if (!msg) return null;
  if (animusState.messagesShown.includes(day)) return null;
  return msg;
}

/**
 * Mark a message as shown and call its onShow hook.
 * @param {number} day
 * @param {object} animusState
 * @param {boolean} [followed] — whether the player followed the task
 */
export function markMessageShown(day, animusState, followed = false) {
  const msg = ANIMUS_MESSAGES[day];
  if (!msg) return;
  if (!animusState.messagesShown.includes(day)) animusState.messagesShown.push(day);
  try { msg.onShow(animusState, followed); } catch (_) {}
}

// ── TASK TRACKING ─────────────────────────────────────────────

/**
 * Record the player's response to an ANIMUS task.
 * Mutates animusState in place.
 *
 * @param {object}  animusState
 * @param {string}  taskId    — e.g. 'animus_task_1'
 * @param {boolean} followed  — true if player cooperated
 */
export function recordAnimusTask(animusState, taskId, followed) {
  if (!animusState.tasksCompleted.includes(taskId)) {
    animusState.tasksCompleted.push(taskId);
  }
  if (followed) {
    animusState.tasksFollowed++;
    animusState.alignment = Math.min(100, animusState.alignment + 8);
  } else {
    animusState.alignment = Math.max(0, animusState.alignment - 5);
  }
}

// ── GLITCH EFFECTS ────────────────────────────────────────────

/**
 * Trigger deferred visual glitch effects for the day.
 * Calls window.triggerGlitch / window.triggerNameGlitch / window.showAnimusSymbol
 * after randomised delays. All DOM calls are guarded.
 *
 * @param {number} day
 */
export function triggerAnimusGlitchForDay(day) {
  if (typeof window === 'undefined') return;
  if (typeof window.triggerGlitch !== 'function') return;

  if (day >= 4 && day <= 8) {
    setTimeout(() => window.triggerGlitch(), 4000 + Math.random() * 8000);
  }
  if (day >= 6) {
    setTimeout(() => {
      if (typeof window.triggerNameGlitch === 'function') window.triggerNameGlitch();
    }, 12000 + Math.random() * 15000);
  }
  if (day >= 8) {
    setTimeout(() => {
      if (typeof window.showAnimusSymbol === 'function') window.showAnimusSymbol();
    }, 20000 + Math.random() * 40000);
  }
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Patch window.* globals so legacy story.js callers continue to work.
 * Legacy story.js reads window.StoryState.animus directly, so we keep
 * that object in sync via the install bridge.
 */
export function install() {
  if (typeof window === 'undefined') return;
  window.ANIMUS_MESSAGES   = ANIMUS_MESSAGES;
  window.ANIMUS_PASSENGERS = ANIMUS_PASSENGERS;
  window.recordAnimusTask  = (taskId, followed) => {
    const ss = window.StoryState;
    if (ss && ss.animus) recordAnimusTask(ss.animus, taskId, followed);
  };
  window.triggerAnimusGlitchForDay = triggerAnimusGlitchForDay;
  console.log('[AnimusSystem] Installed.');
}
