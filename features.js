/* ════════════════════════════════════════════════════
   PROGRESSIVE FEATURE UNLOCKS
   Slide-in notification when new mechanics unlock.
   Seen flags stored in localStorage['chk_features_seen']
════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const STORAGE_KEY = 'chk_features_seen';

  // Day → feature unlock message (Turkish)
  const UNLOCKS = {
    2: {
      title: 'YENİ ÖZELLİK AÇILDI',
      body:  'VİZE KONTROLÜ aktif. Artık yolcuların vize gereksinimlerini kontrol etmelisiniz.'
    },
    3: {
      title: 'YENİ ÖZELLİK AÇILDI',
      body:  'BİYOMETRİK TARAMA aktif. Yüz ve parmak izi eşleşmesini doğrulayın.'
    },
    5: {
      title: 'YENİ ÖZELLİK AÇILDI',
      body:  'RFID ÇİP OKUMA aktif. Pasaportlardaki çip verilerini kontrol edin.'
    },
    7: {
      title: 'YENİ ÖZELLİK AÇILDI',
      body:  'INTERPOL VERİTABANI aktif. Kara liste sorgusu artık mümkün.'
    },
    10: {
      title: 'YENİ ÖZELLİK AÇILDI',
      body:  'EES GİRİŞ/ÇIKIŞ KAYITLARI aktif. Seyahat geçmişi doğrulanabilir.'
    },
    14: {
      title: 'UYARI',
      body:  'İstihbarat: Sınırda sahte belge operasyonu saptandı. Dikkatli olun.'
    },
    19: {
      title: 'SON GÜN YAKLAŞIYOR',
      body:  'Bitiş aşamasına girdiniz. Kararlarınızın ağırlığını hissedeceksiniz.'
    },
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

  function showNotif(title, body, onDone) {
    const el = document.getElementById('feature-notif');
    if (!el) { if (onDone) onDone(); return; }

    el.innerHTML = `<div style="color:var(--accent);margin-bottom:4px;">${title}</div>
                    <div style="color:var(--text);font-family:var(--font-mono);font-size:9px;">${body}</div>`;

    // Slide in
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
    el.style.pointerEvents = 'none';

    // Auto-dismiss after 4s, then slide out
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
    const { title, body, onDone } = notifQueue.shift();
    showNotif(title, body, onDone);
  }

  function queueNotif(title, body, onDone) {
    notifQueue.push({ title, body, onDone });
    processQueue();
  }

  // Public API
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
    queueNotif(unlock.title, unlock.body, callback);
  };

  window.resetFeaturesSeen = function() {
    localStorage.removeItem(STORAGE_KEY);
  };

})();
