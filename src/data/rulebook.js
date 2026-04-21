/* ================================================================
   CHECKPOINT — Rulebook Data
   Pure data module. Zero logic, zero DOM, zero side-effects.

   Setting: Sabiha Gökçen Uluslararası Havalimanı, Istanbul, Turkey
   TUR = home nation (no visa).
   EU (DEU,FRA,ITA,ESP,POL,ROU,GRC,NLD) = 90-day visa-free.
   UKR = e-visa required.
   SYR = visa + humanitarian permit required.

   Each entry is keyed by the first day it takes effect.
   getRulesForDay() in RuleEngine.js does a walk-back to find the
   most recent applicable entry.

   Exports:
     RULEBOOK  — keyed by day number
================================================================ */

export const RULEBOOK = {
  1: {
    nations:      ['TUR'],
    visaRequired: false,
    chipCheck:    false,
    label: {
      en: 'Turkish citizens only. Valid Turkish passport required.',
      tr: 'Yalnızca Türk vatandaşları. Geçerli Türk pasaportu zorunludur.',
    },
  },
  2: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    false,
    label: {
      en: 'All nations open. EU nationals: visa-free up to 90 days. Ukraine & Syria: visa required. EES now active.',
      tr: 'Tüm uyruklar açık. AB vatandaşları: 90 güne kadar vizesiz. Ukrayna ve Suriye: vize zorunludur. EES aktif.',
    },
  },
  3: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    false,
    label: {
      en: 'German passengers arriving from Bavaria region must present health declaration form (respiratory illness outbreak).',
      tr: 'Bavyera bölgesinden gelen Alman yolcular sağlık beyanı sunmalıdır (solunum hastalığı salgını).',
    },
  },
  4: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    false,
    label: {
      en: 'Work and study stays over 90 days require residence permit in addition to visa.',
      tr: '90 günü aşan çalışma ve eğitim kalışları standart vizeye ek olarak ikamet izni gerektirir.',
    },
  },
  5: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'RFID chip verification now mandatory. ⚠ INTERPOL ALERT: Document forgery ring active — increased scrutiny on Romanian and Ukrainian passports.',
      tr: 'RFID çip doğrulaması artık zorunludur. ⚠ INTERPOL UYARISI: Belge sahteciliği şebekesi aktif — Rumen ve Ukraynalı pasaportlarda artan denetim.',
    },
  },
  6: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'Standard processing. Chip check mandatory.',
      tr: 'Standart işlem. Çip kontrolü zorunludur.',
    },
  },
  7: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'EU Diplomatic Summit — all EU diplomatic passport holders: expedited processing. Regular rules otherwise.',
      tr: 'AB Diplomatik Zirvesi — tüm AB diplomatik pasaport sahiplerine: hızlandırılmış işlem. Aksi halde normal kurallar geçerli.',
    },
  },
  8: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    terrorLevel:  true,
    label: {
      en: '⚠ THREAT LEVEL ELEVATED. All entrants subject to secondary biometric check.',
      tr: '⚠ TEHDİT SEVİYESİ YÜKSELTİLDİ. Tüm girenler ikincil biyometrik kontrole tabidir.',
    },
  },
  9: {
    nations:        'all',
    visaRequired:   true,
    chipCheck:      true,
    flaggedNations: ['UKR'],
    label: {
      en: '⚠ Ukrainian border situation escalating — all UKR nationals require additional screening. Flag for secondary inspection.',
      tr: '⚠ Ukrayna sınır durumu tırmanıyor — tüm UKR vatandaşları ek taramaya tabidir. İkincil inceleme için işaretleyin.',
    },
  },
  10: {
    nations:        'all',
    visaRequired:   true,
    chipCheck:      true,
    overstayDetain: true,
    label: {
      en: 'EES overstay now mandates DETAIN (not just deny). Flag accordingly.',
      tr: 'EES aşımı artık GÖZALTINI zorunlu kılıyor (sadece reddetmek yeterli değil). Buna göre işaretleyin.',
    },
  },
  11: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: '⚠ INTERPOL RED NOTICE: Watch for passport series FR-88XX-XXX (French passports in this range). Verify thoroughly.',
      tr: '⚠ INTERPOL KIRMIZI UYARISI: FR-88XX-XXX serili pasaportlara dikkat edin. Titizlikle doğrulayın.',
    },
  },
  12: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    interpol:     'detain',
    label: {
      en: 'Interpol hits now mandate DETAIN, not DENY.',
      tr: 'Interpol eşleşmeleri artık GÖZALTINI zorunlu kılıyor, reddetme değil.',
    },
  },
  13: {
    nations:       'all',
    visaRequired:  true,
    chipCheck:     true,
    bannedNations: ['SYR'],
    label: {
      en: '⚠ Syrian refugee processing suspended — all SYR passports: DENY until further notice.',
      tr: '⚠ Suriyeli mülteci işlemi askıya alındı — tüm SYR pasaportları: bir sonraki bildirime kadar REDDET.',
    },
  },
  14: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'Press equipment requires special permit. Check boarding pass purpose field.',
      tr: 'Basın ekipmanı özel izin gerektiriyor. Biniş kartı amaç alanını kontrol edin.',
    },
  },
  15: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'Health declaration requirement lifted for German passengers. Bavarian restrictions ended.',
      tr: 'Alman yolcular için sağlık beyanı zorunluluğu kaldırıldı. Bavyera kısıtlamaları sona erdi.',
    },
  },
  17: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: 'New bilateral agreement: Ukrainian nationals with valid work contracts no longer require e-visa.',
      tr: 'Yeni ikili anlaşma: Geçerli iş sözleşmesi olan Ukraynalı vatandaşlar artık e-vize gerektirmiyor.',
    },
  },
  19: {
    nations:      'all',
    visaRequired: true,
    chipCheck:    true,
    label: {
      en: '⚠ Mass flight cancellations from Rome — verify boarding pass dates carefully for Italian passengers.',
      tr: '⚠ Roma\'dan toplu uçuş iptalleri — İtalyan yolcular için biniş kartı tarihlerini dikkatlice doğrulayın.',
    },
  },
};
