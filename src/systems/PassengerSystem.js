/* ================================================================
   CHECKPOINT — PassengerSystem
   Generates procedural passengers for each day's queue.

   Exports:
     WORLD_DATA        — nations, names, cities, airlines …
     genMRZ()          — machine-readable zone generator
     generatePassenger(day, gameState)  — main entry point
     install()         — patches window._genMRZ for story.js compat

   Dependencies: none (pure JS, no DOM, no window globals)
   The only runtime bridge is window.t() for behaviour strings and
   window.getRulesForDay() for anomaly decisions — both are resolved
   lazily so the module is still testable without the DOM.
================================================================ */

// ── WORLD DATA ───────────────────────────────────────────────
export const NATIONS     = ['TUR','DEU','FRA','ITA','ESP','POL','ROU','GRC','NLD','UKR','SYR'];
export const EU_NATIONS  = ['DEU','FRA','ITA','ESP','POL','ROU','GRC','NLD'];
export const VISA_REQUIRED = ['UKR','SYR'];

export const NAMES_BY_NATION = {
  TUR: {
    M:    ['Mehmet','Ali','Mustafa','Ahmet','İbrahim','Hasan','Emre','Burak','Serkan','Onur'],
    F:    ['Ayşe','Fatma','Zeynep','Emine','Elif','Merve','Selin','Nur','Gül','Derya'],
    last: ['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Doğan','Kılıç','Aslan','Çetin'],
  },
  DEU: {
    M:    ['Hans','Klaus','Friedrich','Georg','Peter','Michael','Thomas','Andreas','Stefan','Markus'],
    F:    ['Anna','Lena','Maria','Emma','Sophie','Julia','Katrin','Ingrid','Monika','Sabine'],
    last: ['Schmidt','Weber','Fischer','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter'],
  },
  FRA: {
    M:    ['Pierre','Jean','Louis','François','Michel','Philippe','René','Jacques','Antoine','Étienne'],
    F:    ['Marie','Sophie','Isabelle','Camille','Céline','Anne','Claire','Nathalie','Émilie','Chloé'],
    last: ['Dubois','Martin','Bernard','Thomas','Robert','Richard','Petit','Laurent','Simon','Michel'],
  },
  ITA: {
    M:    ['Marco','Antonio','Giuseppe','Luca','Giovanni','Francesco','Andrea','Roberto','Stefano','Alessandro'],
    F:    ['Giulia','Maria','Sofia','Laura','Valentina','Chiara','Martina','Sara','Elena','Anna'],
    last: ['Ferrari','Romano','Esposito','Bianchi','Ricci','Marino','Greco','Bruno','Gallo','Conti'],
  },
  ESP: {
    M:    ['Carlos','Miguel','José','Antonio','Francisco','Pedro','Juan','Manuel','Luis','David'],
    F:    ['Ana','María','Carmen','Isabel','Lucía','Elena','Sofía','Paula','Laura','Cristina'],
    last: ['García','Martínez','López','González','Rodríguez','Fernández','Sánchez','Pérez','Torres','Ramírez'],
  },
  POL: {
    M:    ['Piotr','Tomasz','Marek','Paweł','Andrzej','Krzysztof','Michał','Grzegorz','Jacek','Rafał'],
    F:    ['Agnieszka','Katarzyna','Anna','Monika','Joanna','Małgorzata','Ewa','Barbara','Aleksandra','Marta'],
    last: ['Kowalski','Wiśniewski','Wójcik','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Kowalczyk','Dąbrowski'],
  },
  ROU: {
    M:    ['Ion','Alexandru','Gheorghe','Mihai','Andrei','Bogdan','Cristian','Daniel','Florin','Adrian'],
    F:    ['Maria','Elena','Ana','Ioana','Mihaela','Andreea','Cristina','Florentina','Raluca','Laura'],
    last: ['Popescu','Ionescu','Popa','Dumitru','Constantin','Stan','Gheorghe','Matei','Marin','Barbu'],
  },
  GRC: {
    M:    ['Nikos','Dimitris','Giorgos','Kostas','Yannis','Petros','Stavros','Alexandros','Michalis','Spyros'],
    F:    ['Elena','Maria','Katerina','Dimitra','Anna','Christina','Despina','Eleni','Sofia','Ioanna'],
    last: ['Papadopoulos','Georgiou','Alexiou','Andreou','Nikolaou','Petridis','Stavrou','Vasiliou','Christodoulou','Anastasiadis'],
  },
  NLD: {
    M:    ['Jan','Pieter','Willem','Hendrik','Dirk','Klaas','Arjan','Sander','Mark','Tim'],
    F:    ['Emma','Anna','Lies','Sophie','Fleur','Noor','Lisa','Laura','Eva','Marieke'],
    last: ['De Vries','Van den Berg','De Boer','Bakker','Visser','Smit','Meijer','De Graaf','Mulder','Dekker'],
  },
  UKR: {
    M:    ['Oleksiy','Dmytro','Ivan','Mykola','Vasyl','Andriy','Serhiy','Oleh','Yuriy','Bohdan'],
    F:    ['Natalia','Oksana','Olha','Iryna','Tetiana','Yulia','Vira','Larysa','Svitlana','Halyna'],
    last: ['Kovalenko','Shevchenko','Bondarenko','Tkachenko','Kovalchuk','Marchenko','Petrenko','Morozenko','Sydorenko','Lysenko'],
  },
  SYR: {
    M:    ['Ahmad','Omar','Hassan','Khaled','Ali','Mohammed','Ibrahim','Tariq','Faris','Samer'],
    F:    ['Fatima','Rania','Nour','Hana','Layla','Yasmin','Amira','Sara','Dina','Rima'],
    last: ['Al-Hassan','Al-Ibrahim','Al-Mohammed','Al-Ahmad','Al-Khalid','Ibrahim','Hassan','Ahmad','Al-Faris','Mustafa'],
  },
};

export const CITIES = {
  TUR: ['İstanbul','Ankara','İzmir','Bursa','Antalya','Konya','Adana','Gaziantep','Trabzon','Kayseri'],
  DEU: ['Berlin','Munich','Hamburg','Frankfurt','Stuttgart','Cologne','Düsseldorf','Leipzig','Bremen','Dresden'],
  FRA: ['Paris','Lyon','Marseille','Toulouse','Nice','Bordeaux','Nantes','Strasbourg','Lille','Grenoble'],
  ITA: ['Rome','Milan','Naples','Turin','Florence','Venice','Bologna','Palermo','Genoa','Bari'],
  ESP: ['Madrid','Barcelona','Seville','Valencia','Bilbao','Zaragoza','Málaga','Alicante','Córdoba','Granada'],
  POL: ['Warsaw','Kraków','Łódź','Wrocław','Gdańsk','Poznań','Katowice','Lublin','Białystok','Rzeszów'],
  ROU: ['Bucharest','Cluj-Napoca','Timișoara','Iași','Brașov','Constanța','Craiova','Galați','Ploiești','Oradea'],
  GRC: ['Athens','Thessaloniki','Patras','Heraklion','Larissa','Rhodes','Volos','Ioannina','Chania','Kavala'],
  NLD: ['Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven','Tilburg','Groningen','Almere','Breda','Nijmegen'],
  UKR: ['Kyiv','Kharkiv','Odessa','Lviv','Dnipro','Zaporizhzhia','Mykolaiv','Mariupol','Ternopil','Vinnytsia'],
  SYR: ['Damascus','Aleppo','Homs','Latakia','Tartus','Raqqa','Deir ez-Zor','Qamishli','Daraa','Idlib'],
};

export const PASSPORT_COVER = {
  TUR: 'TÜRKİYE CUMHURİYETİ / REPUBLIC OF TURKEY',
  DEU: 'BUNDESREPUBLIK DEUTSCHLAND / EUROPEAN UNION',
  FRA: 'RÉPUBLIQUE FRANÇAISE / EUROPEAN UNION',
  ITA: 'REPUBBLICA ITALIANA / EUROPEAN UNION',
  ESP: 'REINO DE ESPAÑA / EUROPEAN UNION',
  POL: 'RZECZPOSPOLITA POLSKA / EUROPEAN UNION',
  ROU: 'ROMÂNIA / EUROPEAN UNION',
  GRC: 'ΕΛΛΗΝΙΚΉ ΔΗΜΟΚΡΑΤΙΑ / EUROPEAN UNION',
  NLD: 'KONINKRIJK DER NEDERLANDEN / EUROPEAN UNION',
  UKR: 'УКРАЇНА',
  SYR: 'الجمهورية العربية السورية',
};

export const PASSPORT_COLOR = {
  TUR: '#6b0032', DEU: '#1a2a5a', FRA: '#1a2a5a', ITA: '#1a2a5a',
  ESP: '#1a2a5a', POL: '#1a2a5a', ROU: '#1a2a5a', GRC: '#1a2a5a',
  NLD: '#1a2a5a', UKR: '#1040a0', SYR: '#1a4a1a',
};

export const PURPOSES = [
  'Tourism','Business','Transit','Family Visit','Medical','Study','Work',
];

export const AIRLINES = [
  'Turkish Airlines','Pegasus','Lufthansa','Air France','ITA Airways',
  'Iberia','LOT Polish','Blue Air','Aegean Airlines','KLM',
  'Ukraine Intl.','SunExpress','Wizair','EasyJet',
];

export const AIRLINE_CODES = [
  'TK','PC','LH','AF','AZ','IB','LO','0B','A3','KL','PS','XQ','W6','U2',
];

// ── PURE UTILITIES ────────────────────────────────────────────
export const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick  = arr    => arr[rand(0, arr.length - 1)];
export const padZ  = (n, l) => String(n).padStart(l, '0');

export function randDate(minYear, maxYear) {
  const y = rand(minYear, maxYear);
  const m = rand(1, 12);
  const d = rand(1, 28);
  return { y, m, d, str: `${y}.${padZ(m,2)}.${padZ(d,2)}` };
}

/** Returns an expiry date string offset from the game's base date (2026-04-13). */
export function dateAfterToday(day, years) {
  const base = new Date(2026, 3, 13);
  base.setFullYear(base.getFullYear() + years - Math.floor(day / 10));
  return `${base.getFullYear()}.${padZ(base.getMonth()+1,2)}.${padZ(base.getDate(),2)}`;
}

export function genPassportNumber(nation) {
  const prefix = nation.substring(0, 3).toUpperCase();
  const alpha  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return `${prefix}${rand(100000,999999)}${alpha[rand(0,alpha.length-1)]}${alpha[rand(0,alpha.length-1)]}`;
}

/**
 * Generate ICAO 9303 Machine Readable Zone lines.
 * Used both here and in story.js (exposed via window._genMRZ).
 */
export function genMRZ(surname, given, nation, dob, passNo, expiry, sex) {
  const padR   = (s, l, ch='<') => (s.replace(/[^A-Z0-9]/g,'<') + ch.repeat(l)).substring(0, l);
  const natCode = nation.substring(0,3).toUpperCase().padEnd(3,'<');
  const line1   = `P<${natCode}${padR(surname.toUpperCase(), 39)}`;
  const pn      = padR(passNo.replace(/-/g,''), 9);
  const dobF    = dob.replace(/\./g,'').substring(2);
  const expF    = expiry.replace(/\./g,'').substring(2);
  const line2   = `${pn}0${natCode}${dobF}${sex === 'M' ? '0' : '1'}${expF}0${padR(given.toUpperCase(), 14)}`;
  return [line1, line2];
}

// ── INTERNAL GENERATION HELPERS ───────────────────────────────

function generateBiometrics() {
  return {
    faceScore:   rand(88, 99),
    fingerScore: rand(90, 99),
    chipRead:    'OK',
    faceOk:      true,
    fingerOk:    true,
    chipOk:      true,
  };
}

function generateDBChecks(nation) {
  return {
    interpol: 'CLEAR',
    national: 'CLEAR',
    visa:     VISA_REQUIRED.includes(nation) ? 'PENDING' : 'N/A',
    ees:      'NO PRIOR ENTRY',
    flight:   'CONFIRMED',
  };
}

/** Weighted random pick from [ { v, w }, … ] */
function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.w;
    if (r <= 0) return item.v;
  }
  return items[items.length - 1].v;
}

/** Apply an anomaly to the mutable ctx object produced by generatePassenger. */
function applyAnomaly(type, ctx) {
  const { biometrics, dbChecks, boardingPass, anomalies, visa } = ctx;

  switch (type) {
    case 'expired_passport': {
      const expDate = '2024.03.15';
      ctx.expiry = expDate;
      anomalies.push({
        type, severity: 'high',
        desc: `Passport expired ${expDate}`,
        i18n: { key: 'anomaly.expired_passport', params: { date: expDate } },
      });
      break;
    }
    case 'chip_mismatch':
      biometrics.chipOk   = false;
      biometrics.chipRead = 'MISMATCH';
      anomalies.push({ type, severity: 'high', desc: 'RFID chip data does not match printed passport fields', i18n: { key: 'anomaly.chip_mismatch' } });
      break;

    case 'face_mismatch':
      biometrics.faceScore = rand(42, 62);
      biometrics.faceOk    = false;
      anomalies.push({ type, severity: 'high', desc: `Low facial match: ${biometrics.faceScore}%`, i18n: { key: 'anomaly.face_mismatch', params: { score: biometrics.faceScore } } });
      break;

    case 'missing_visa':
      ctx.visa     = null;
      dbChecks.visa = 'MISSING';
      anomalies.push({ type, severity: 'high', desc: 'No valid visa — entry permit required', i18n: { key: 'anomaly.missing_visa' } });
      break;

    case 'expired_visa': {
      const vExp = '2025.11.20';
      if (visa) { visa.expiry = vExp; dbChecks.visa = 'EXPIRED'; }
      anomalies.push({ type, severity: 'high', desc: `Visa expired ${vExp}`, i18n: { key: 'anomaly.expired_visa', params: { date: vExp } } });
      break;
    }
    case 'watchlist_hit':
      dbChecks.interpol = 'HIT — LEVEL 2';
      anomalies.push({ type, severity: 'critical', desc: 'Interpol watchlist match — notify security', i18n: { key: 'anomaly.watchlist_hit' } });
      break;

    case 'ees_overstay':
      dbChecks.ees = 'OVERSTAY — LAST EXIT MISSING';
      anomalies.push({ type, severity: 'high', desc: 'EES overstay — no registered exit', i18n: { key: 'anomaly.ees_overstay' } });
      break;

    case 'boarding_name_mismatch': {
      const rn = NAMES_BY_NATION[pick(NATIONS)];
      if (boardingPass) {
        boardingPass.passengerName = `${pick(rn.last).toUpperCase()} ${pick(rn.M).toUpperCase()}`;
      }
      anomalies.push({ type, severity: 'medium', desc: 'Boarding pass name does not match passport', i18n: { key: 'anomaly.boarding_name_mismatch' } });
      break;
    }
    case 'contraband':
      dbChecks.national = 'CUSTOMS FLAG — UNDECLARED GOODS';
      anomalies.push({ type, severity: 'high', desc: 'Customs database flags undeclared contraband', i18n: { key: 'anomaly.contraband' } });
      break;

    case 'student_wrong_visa': {
      const wrongType = (visa && visa.type) || 'Type-C (Short Stay)';
      if (visa) visa.purpose = 'Tourism';
      anomalies.push({ type, severity: 'high', desc: `Student visa required — presented ${wrongType}`, i18n: { key: 'anomaly.student_wrong_visa' } });
      break;
    }
  }
}

/** Choose a behavior string based on anomaly severity. */
function pickBehavior(anomalies) {
  const t = (typeof window !== 'undefined' && window.t) ? window.t : (k => k);
  if (anomalies.some(a => a.severity === 'critical')) return pick([t('behavior.critical1'), t('behavior.critical2')]);
  if (anomalies.some(a => a.severity === 'high'))     return pick([t('behavior.high1'), t('behavior.high2'), t('behavior.high3')]);
  return pick([t('behavior.normal1'), t('behavior.normal2'), t('behavior.normal3'), null, null]);
}

/** Choose a random micro-event for a passenger (30% chance, day ≥ 2). */
function pickMicroEvent(anomalies, day) {
  if (day < 2) return null;
  if (Math.random() > 0.30) return null;

  const events = [
    { type: 'bribe_offer',        amount: rand(50, 200) },
    { type: 'diplomatic_immunity' },
    { type: 'lost_boarding_pass'  },
    { type: 'nickname_mismatch'   },
    { type: 'crying_family',      member: pick(['spouse','child','parent','sibling']) },
    { type: 'diplomatic_courier', country: pick(['DEU','FRA','GRC','NLD']) },
    { type: 'medical_emergency',  condition: pick(['chest pain','severe allergic reaction','diabetic episode']) },
    { type: 'returning_citizen'   },
    { type: 'crying_child'        },
  ];
  if (anomalies.length > 0 && day >= 3) {
    events.push({ type: 'visibly_ill' });
  }
  return pick(events);
}

// ── COUNTER (module-scoped, resets on page reload) ────────────
let _passengerIdCounter = 0;

/** Reset the passenger ID counter (call at the start of each new game). */
export function resetPassengerCounter() {
  _passengerIdCounter = 0;
}

// ── MAIN ENTRY POINT ─────────────────────────────────────────

/**
 * Generate one procedural passenger for the given day.
 *
 * @param {number} day        — current game day (1-based)
 * @param {object} [gameState]— GameState singleton (optional; used for day-specific rules)
 * @returns {PassengerObject}
 */
export function generatePassenger(day, gameState) {
  _passengerIdCounter++;
  const id = _passengerIdCounter;

  const nation    = day === 1 ? 'TUR' : pick(NATIONS);
  const sex       = pick(['M', 'F']);
  const names     = NAMES_BY_NATION[nation] || NAMES_BY_NATION['DEU'];
  const firstName = pick(names[sex]);
  const lastName  = pick(names.last);
  const dob       = randDate(1950, 2000).str;
  const height    = rand(155, 195);
  const weight    = rand(50, 110);
  const issueCity = pick(CITIES[nation] || ['Unknown']);
  const expiry    = dateAfterToday(day, rand(1, 8));
  const passNo    = genPassportNumber(nation);

  const [mrzL1, mrzL2] = genMRZ(lastName, firstName, nation, dob, passNo, expiry, sex);

  // Missing document flags
  const missingPassport     = day >= 3 && Math.random() < 0.04;
  const missingBoardingPass = day >= 4 && Math.random() < 0.06;

  // Visa
  let visa = null;
  if (VISA_REQUIRED.includes(nation) && day >= 2) {
    let visaType;
    if (nation === 'SYR')      visaType = pick(['Humanitarian Permit','Type-C (Special Clearance)']);
    else if (nation === 'UKR') visaType = pick(['e-Visa (Turkey)','Type-C (Short Stay)']);
    else                       visaType = pick(['Type-C (Short Stay)','Type-D (Long Stay)','Type-A (Transit)']);
    visa = {
      type:    visaType,
      number:  `V-${rand(100000,999999)}`,
      issued:  randDate(2025, 2026).str,
      expiry:  dateAfterToday(day, rand(1, 3)),
      purpose: pick(PURPOSES),
      nation:  'T.C. Dışişleri Bakanlığı / Ministry of Foreign Affairs',
    };
  }

  // Boarding pass
  const airlineIdx = rand(0, AIRLINES.length - 1);
  const boardingPass = missingBoardingPass ? null : {
    airline:       AIRLINES[airlineIdx],
    flightNo:      `${AIRLINE_CODES[airlineIdx] || 'XX'}${rand(100,999)}`,
    from:          issueCity,
    to:            'SAW — Sabiha Gökçen, Istanbul',
    date:          '2026.04.14',
    seat:          `${rand(1,40)}${pick(['A','B','C','D','E','F'])}`,
    passengerName: `${lastName.toUpperCase()} ${firstName.toUpperCase()}`,
  };

  const biometrics = generateBiometrics();
  const dbChecks   = generateDBChecks(nation);
  const anomalies  = [];

  // Inject anomaly
  const errorChance = Math.min(0.15 + day * 0.05, 0.65);
  if (missingPassport) {
    anomalies.push({ type: 'no_passport', severity: 'high', desc: 'No travel document presented', i18n: { key: 'anomaly.no_passport' } });
  } else if (Math.random() < errorChance) {
    const errorType = pickWeighted([
      { v: 'expired_passport',       w: 0.13 },
      { v: 'chip_mismatch',          w: 0.17 },
      { v: 'face_mismatch',          w: 0.13 },
      { v: 'missing_visa',           w: 0.13 },
      { v: 'expired_visa',           w: 0.09 },
      { v: 'watchlist_hit',          w: 0.09 },
      { v: 'ees_overstay',           w: 0.09 },
      { v: 'boarding_name_mismatch', w: 0.05 },
      { v: 'contraband',             w: 0.07 },
      { v: 'student_wrong_visa',     w: 0.06 },
    ]);
    // ctx is mutable — applyAnomaly will modify biometrics, dbChecks, visa in place
    const ctx = { firstName, lastName, biometrics, dbChecks, boardingPass, anomalies, visa, expiry, day };
    applyAnomaly(errorType, ctx);
  }

  if (missingBoardingPass && !anomalies.some(a => a.type === 'no_passport')) {
    anomalies.push({ type: 'no_boarding_pass', severity: 'medium', desc: 'No boarding pass presented', i18n: { key: 'anomaly.no_boarding_pass' } });
  }

  const behavior  = pickBehavior(anomalies);
  const microEvent = pickMicroEvent(anomalies, day);

  // Correct decision — delegate to RuleEngine if available, else inline
  let correctDecision = 'approve';
  if (typeof window !== 'undefined' && window.getRulesForDay) {
    const rules = window.getRulesForDay(day);
    if (rules) {
      if (rules.bannedNations && rules.bannedNations.includes(nation))           correctDecision = 'deny';
      else if (rules.nations !== 'all' && !rules.nations.includes(nation))       correctDecision = 'deny';
      else if (anomalies.find(a => a.type === 'watchlist_hit'))                  correctDecision = 'detain';
      else if (anomalies.find(a => a.type === 'ees_overstay'))
        correctDecision = rules.overstayDetain ? 'detain' : 'deny';
      else if (!anomalies.length)                                                correctDecision = 'approve';
      else if (anomalies.some(a => a.severity === 'critical'))                   correctDecision = 'detain';
      else if (anomalies.some(a => a.severity === 'high'))                       correctDecision = 'deny';
      else                                                                        correctDecision = 'deny';
    }
  }

  return {
    id,
    firstName, lastName, nation, sex, dob, height, weight, issueCity,
    passportCoverText: PASSPORT_COVER[nation] || nation.toUpperCase(),
    passportColor:     PASSPORT_COLOR[nation] || '#1a2a5a',
    missingPassport,
    missingBoardingPass,
    passport: missingPassport ? null : {
      number: passNo, expiry, mrzL1, mrzL2,
      chip: {
        name:    `${lastName}, ${firstName}`,
        dob, nation, expiry,
        number:  passNo,
        biohash: `BIO-${rand(10000,99999)}-${rand(10000,99999)}`,
      },
    },
    visa,
    boardingPass,
    biometrics,
    dbChecks,
    anomalies,
    behavior,
    microEvent,
    correctDecision,
  };
}

// ── BACKWARD COMPATIBILITY ────────────────────────────────────

/**
 * Expose helpers on window so legacy scripts (story.js, game.js) can
 * call them without importing this module.
 *
 * Called once from src/main.js during bootstrap.
 */
export function install() {
  if (typeof window === 'undefined') return;
  window._genMRZ              = genMRZ;
  window._generatePassenger   = generatePassenger;
  window._resetPassengerCounter = resetPassengerCounter;
  console.log('[PassengerSystem] Installed.');
}
