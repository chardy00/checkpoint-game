/* ════════════════════════════════════════════════════
   PROGRESSIVE FEATURE UNLOCKS
   Slide-in notification when new mechanics unlock.
   Seen flags stored in localStorage['chk_features_seen']
════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'chk_features_seen';

  // Day → translation key pair { titleKey, bodyKey }
  const UNLOCKS = {
    2:  { titleKey: 'feature.unlockTitle',   bodyKey: 'feature.visa.body'      },
    3:  { titleKey: 'feature.unlockTitle',   bodyKey: 'feature.biometric.body' },
    5:  { titleKey: 'feature.unlockTitle',   bodyKey: 'feature.rfid.body'      },
    7:  { titleKey: 'feature.unlockTitle',   bodyKey: 'feature.interpol.body'  },
    10: { titleKey: 'feature.unlockTitle',   bodyKey: 'feature.ees.body'       },
    14: { titleKey: 'feature.warning14.title', bodyKey: 'feature.warning14.body' },
    19: { titleKey: 'feature.final.title',   bodyKey: 'feature.final.body'     },
  };

  function getSeenSet() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch(e) { return new Set(); }
  }

  function markSeen(day) {
    const seen = getSeenSet();
    seen.add(day);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  }

  let notifQueue = [];
  let notifBusy  = false;

  function showNotif(titleKey, bodyKey, onDone) {
    const el = document.getElementById('feature-notif');
    if (!el) { if (onDone) onDone(); return; }

    const T = window.t || (k => k);
    el.innerHTML = `<div style="color:var(--accent);margin-bottom:4px;">${T(titleKey)}</div>
                    <div style="color:var(--text);font-family:var(--font-mono);font-size:9px;">${T(bodyKey)}</div>`;

    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.pointerEvents = 'none';

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-100%)';
      setTimeout(() => {
        el.innerHTML = '';
        notifBusy = false;
        if (onDone) onDone();
        processQueue();
      }, 400);
    }, 4000);
  }

  function processQueue() {
    if (notifBusy || notifQueue.length === 0) return;
    notifBusy = true;
    const { titleKey, bodyKey, onDone } = notifQueue.shift();
    showNotif(titleKey, bodyKey, onDone);
  }

  function queueNotif(titleKey, bodyKey, onDone) {
    notifQueue.push({ titleKey, bodyKey, onDone });
    processQueue();
  }

  window.checkFeatureUnlocks = function(day, callback) {
    const unlock = UNLOCKS[day];
    if (!unlock) {
      if (callback) callback();
      return;
    }
    const seen = getSeenSet();
    if (seen.has(day)) {
      if (callback) callback();
      return;
    }
    markSeen(day);
    queueNotif(unlock.titleKey, unlock.bodyKey, callback);
  };

  window.resetFeaturesSeen = function() {
    localStorage.removeItem(STORAGE_KEY);
  };

})();
