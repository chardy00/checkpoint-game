/* ============================================================
   CHECKPOINT — Biometric Border Control
   Game Engine v0.1
   ============================================================ */

'use strict';

// ── CONSTANTS ────────────────────────────────────────────────
const SALARY_PER_CORRECT   = 10;
const PENALTY_PER_MISTAKE  = 5;
const COST_FOOD            = 20;
const COST_HEAT            = 15;
const COST_MEDICINE        = 30;
const TIME_PER_PASSENGER   = 180;   // seconds (simulated)
const DAY_DURATION         = 1800;  // seconds per day

// ── WORLD DATA ───────────────────────────────────────────────
// SETTING: Sabiha Gökçen Uluslararası Havalimanı, Istanbul, Turkey
// TUR = home nation (no visa). EU nations = 90-day visa-free. UKR/SYR = visa required.

const NATIONS = ['TUR','DEU','FRA','ITA','ESP','POL','ROU','GRC','NLD','UKR','SYR'];
const EU_NATIONS = ['DEU','FRA','ITA','ESP','POL','ROU','GRC','NLD'];
const VISA_REQUIRED = ['UKR','SYR'];

// Culturally accurate names per nationality
const NAMES_BY_NATION = {
  TUR: {
    M: ['Mehmet','Ali','Mustafa','Ahmet','İbrahim','Hasan','Emre','Burak','Serkan','Onur'],
    F: ['Ayşe','Fatma','Zeynep','Emine','Elif','Merve','Selin','Nur','Gül','Derya'],
    last: ['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Doğan','Kılıç','Aslan','Çetin']
  },
  DEU: {
    M: ['Hans','Klaus','Friedrich','Georg','Peter','Michael','Thomas','Andreas','Stefan','Markus'],
    F: ['Anna','Lena','Maria','Emma','Sophie','Julia','Katrin','Ingrid','Monika','Sabine'],
    last: ['Schmidt','Weber','Fischer','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter']
  },
  FRA: {
    M: ['Pierre','Jean','Louis','François','Michel','Philippe','René','Jacques','Antoine','Étienne'],
    F: ['Marie','Sophie','Isabelle','Camille','Céline','Anne','Claire','Nathalie','Émilie','Chloé'],
    last: ['Dubois','Martin','Bernard','Thomas','Robert','Richard','Petit','Laurent','Simon','Michel']
  },
  ITA: {
    M: ['Marco','Antonio','Giuseppe','Luca','Giovanni','Francesco','Andrea','Roberto','Stefano','Alessandro'],
    F: ['Giulia','Maria','Sofia','Laura','Valentina','Chiara','Martina','Sara','Elena','Anna'],
    last: ['Ferrari','Romano','Esposito','Bianchi','Ricci','Marino','Greco','Bruno','Gallo','Conti']
  },
  ESP: {
    M: ['Carlos','Miguel','José','Antonio','Francisco','Pedro','Juan','Manuel','Luis','David'],
    F: ['Ana','María','Carmen','Isabel','Lucía','Elena','Sofía','Paula','Laura','Cristina'],
    last: ['García','Martínez','López','González','Rodríguez','Fernández','Sánchez','Pérez','Torres','Ramírez']
  },
  POL: {
    M: ['Piotr','Tomasz','Marek','Paweł','Andrzej','Krzysztof','Michał','Grzegorz','Jacek','Rafał'],
    F: ['Agnieszka','Katarzyna','Anna','Monika','Joanna','Małgorzata','Ewa','Barbara','Aleksandra','Marta'],
    last: ['Kowalski','Wiśniewski','Wójcik','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Kowalczyk','Dąbrowski']
  },
  ROU: {
    M: ['Ion','Alexandru','Gheorghe','Mihai','Andrei','Bogdan','Cristian','Daniel','Florin','Adrian'],
    F: ['Maria','Elena','Ana','Ioana','Mihaela','Andreea','Cristina','Florentina','Raluca','Laura'],
    last: ['Popescu','Ionescu','Popa','Dumitru','Constantin','Stan','Gheorghe','Matei','Marin','Barbu']
  },
  GRC: {
    M: ['Nikos','Dimitris','Giorgos','Kostas','Yannis','Petros','Stavros','Alexandros','Michalis','Spyros'],
    F: ['Elena','Maria','Katerina','Dimitra','Anna','Christina','Despina','Eleni','Sofia','Ioanna'],
    last: ['Papadopoulos','Georgiou','Alexiou','Andreou','Nikolaou','Petridis','Stavrou','Vasiliou','Christodoulou','Anastasiadis']
  },
  NLD: {
    M: ['Jan','Pieter','Willem','Hendrik','Dirk','Klaas','Arjan','Sander','Mark','Tim'],
    F: ['Emma','Anna','Lies','Sophie','Fleur','Noor','Lisa','Laura','Eva','Marieke'],
    last: ['De Vries','Van den Berg','De Boer','Bakker','Visser','Smit','Meijer','De Graaf','Mulder','Dekker']
  },
  UKR: {
    M: ['Oleksiy','Dmytro','Ivan','Mykola','Vasyl','Andriy','Serhiy','Oleh','Yuriy','Bohdan'],
    F: ['Natalia','Oksana','Olha','Iryna','Tetiana','Yulia','Vira','Larysa','Svitlana','Halyna'],
    last: ['Kovalenko','Shevchenko','Bondarenko','Tkachenko','Kovalchuk','Marchenko','Petrenko','Morozenko','Sydorenko','Lysenko']
  },
  SYR: {
    M: ['Ahmad','Omar','Hassan','Khaled','Ali','Mohammed','Ibrahim','Tariq','Faris','Samer'],
    F: ['Fatima','Rania','Nour','Hana','Layla','Yasmin','Amira','Sara','Dina','Rima'],
    last: ['Al-Hassan','Al-Ibrahim','Al-Mohammed','Al-Ahmad','Al-Khalid','Ibrahim','Hassan','Ahmad','Al-Faris','Mustafa']
  },
};

const CITIES = {
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

// Passport cover text per nation
const PASSPORT_COVER = {
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

// Passport cover colour CSS class hint (used by portrait generator)
const PASSPORT_COLOR = {
  TUR: '#6b0032', DEU: '#1a2a5a', FRA: '#1a2a5a', ITA: '#1a2a5a',
  ESP: '#1a2a5a', POL: '#1a2a5a', ROU: '#1a2a5a', GRC: '#1a2a5a',
  NLD: '#1a2a5a', UKR: '#1040a0', SYR: '#1a4a1a',
};

const PURPOSES = ['Tourism','Business','Transit','Family Visit','Medical','Study','Work'];
const AIRLINES  = ['Turkish Airlines','Pegasus','Lufthansa','Air France','ITA Airways','Iberia','LOT Polish','Blue Air','Aegean Airlines','KLM','Ukraine Intl.','SunExpress','Wizair','EasyJet'];
const AIRLINE_CODES = ['TK','PC','LH','AF','AZ','IB','LO','0B','A3','KL','PS','XQ','W6','U2'];

// ── UTILITY ──────────────────────────────────────────────────
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick  = arr    => arr[rand(0, arr.length - 1)];
const padZ  = (n, l) => String(n).padStart(l, '0');

function randDate(minYear, maxYear) {
  const y = rand(minYear, maxYear);
  const m = rand(1, 12);
  const d = rand(1, 28);
  return { y, m, d, str: `${y}.${padZ(m,2)}.${padZ(d,2)}` };
}

function dateAfterToday(dayState, years) {
  const base = new Date(2026, 3, 13); // game starts April 13 2026
  base.setFullYear(base.getFullYear() + years - Math.floor(dayState.day / 10));
  return `${base.getFullYear()}.${padZ(base.getMonth()+1,2)}.${padZ(base.getDate(),2)}`;
}

function dateStr(y, m, d) {
  return `${y}.${padZ(m,2)}.${padZ(d,2)}`;
}

function genPassportNumber(nation) {
  const prefix = nation.substring(0,3).toUpperCase();
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return `${prefix}${rand(100000,999999)}${alpha[rand(0,alpha.length-1)]}${alpha[rand(0,alpha.length-1)]}`;
}

function genMRZ(surname, given, nation, dob, passNo, expiry, sex) {
  const padR = (s, l, ch='<') => (s.replace(/[^A-Z0-9]/g,'<') + ch.repeat(l)).substring(0,l);
  const natCode = nation.substring(0,3).toUpperCase().padEnd(3,'<');
  const line1 = `P<${natCode}${padR(surname.toUpperCase(),39)}`;
  const pn    = padR(passNo.replace(/-/g,''), 9);
  const dobF  = dob.replace(/\./g,'').substring(2);
  const expF  = expiry.replace(/\./g,'').substring(2);
  const line2 = `${pn}0${natCode}${dobF}${sex === 'M' ? '0' : '1'}${expF}0${padR(given.toUpperCase(),14)}`;
  return [line1, line2];
}

// ── PASSENGER GENERATOR ──────────────────────────────────────
let passengerIdCounter = 0;

function generatePassenger(dayState) {
  passengerIdCounter++;
  const id        = passengerIdCounter;
  const nation    = dayState.day === 1 ? 'TUR' : pick(NATIONS);
  const sex       = pick(['M','F']);
  const names     = NAMES_BY_NATION[nation] || NAMES_BY_NATION['DEU'];
  const firstName = pick(names[sex]);
  const lastName  = pick(names.last);
  const dob       = randDate(1950, 2000).str;
  const height    = rand(155, 195);
  const weight    = rand(50, 110);
  const issueCity = pick(CITIES[nation] || ['Unknown']);

  // Passport expiry — base case: valid
  const expiry    = dateAfterToday(dayState, rand(1,8));

  // Passport number
  const passNo    = genPassportNumber(nation);

  // MRZ
  const [mrzL1, mrzL2] = genMRZ(lastName, firstName, nation, dob, passNo, expiry, sex);

  // ── MISSING DOCUMENT FLAGS (Part 5) ─────────────────────────
  // Small chance passengers arrive without passport or without boarding pass
  // These are not "anomaly" flags — they are structural absences
  const missingPassport    = dayState.day >= 3 && Math.random() < 0.04;  // 4% from Day 3
  const missingBoardingPass = dayState.day >= 4 && Math.random() < 0.06; // 6% from Day 4

  // Visa (if required)
  let visa = null;
  if (VISA_REQUIRED.includes(nation) && dayState.day >= 2) {
    let visaType;
    if (nation === 'SYR') {
      visaType = pick(['Humanitarian Permit','Type-C (Special Clearance)']);
    } else if (nation === 'UKR') {
      visaType = pick(['e-Visa (Turkey)','Type-C (Short Stay)']);
    } else {
      visaType = pick(['Type-C (Short Stay)','Type-D (Long Stay)','Type-A (Transit)']);
    }
    visa = {
      type:    visaType,
      number:  `V-${rand(100000,999999)}`,
      issued:  randDate(2025, 2026).str,
      expiry:  dateAfterToday(dayState, rand(1,3)),
      purpose: pick(PURPOSES),
      nation:  'T.C. Dışişleri Bakanlığı / Ministry of Foreign Affairs',
    };
  }

  // Boarding pass
  const airlineIdx = rand(0, AIRLINES.length - 1);
  const boardingPass = missingBoardingPass ? null : {
    airline:     AIRLINES[airlineIdx],
    flightNo:    `${AIRLINE_CODES[airlineIdx] || 'XX'}${rand(100,999)}`,
    from:        issueCity,
    to:          'SAW — Sabiha Gökçen, Istanbul',
    date:        '2026.04.14',
    seat:        `${rand(1,40)}${pick(['A','B','C','D','E','F'])}`,
    passengerName: `${lastName.toUpperCase()} ${firstName.toUpperCase()}`,
  };

  // Biometrics (generated scores)
  const biometrics = generateBiometrics();

  // DB checks
  const dbChecks = generateDBChecks(nation);

  // Anomalies — inject errors randomly based on day difficulty
  const anomalies = [];
  const errorChance = Math.min(0.15 + dayState.day * 0.05, 0.65);

  // Structural missing docs become anomalies for decision scoring
  if (missingPassport) {
    anomalies.push({ type: 'no_passport', severity: 'high', desc: 'No travel document presented',
      i18n: { key: 'anomaly.no_passport' } });
  } else if (Math.random() < errorChance) {
    const errorType = pickWeighted([
      { v: 'expired_passport',      w: 0.13 },
      { v: 'chip_mismatch',         w: 0.17 },
      { v: 'face_mismatch',         w: 0.13 },
      { v: 'missing_visa',          w: 0.13 },
      { v: 'expired_visa',          w: 0.09 },
      { v: 'watchlist_hit',         w: 0.09 },
      { v: 'ees_overstay',          w: 0.09 },
      { v: 'boarding_name_mismatch',w: 0.05 },
      // Phase 4 new anomaly types
      { v: 'contraband',            w: 0.07 },
      { v: 'student_wrong_visa',    w: 0.06 },
    ]);

    applyAnomaly(errorType, { firstName, lastName, nation, expiry, visa, biometrics, dbChecks, boardingPass, anomalies, passNo, dayState });
  }

  if (missingBoardingPass && !anomalies.some(a => a.type === 'no_passport')) {
    anomalies.push({ type: 'no_boarding_pass', severity: 'medium', desc: 'No boarding pass presented',
      i18n: { key: 'anomaly.no_boarding_pass' } });
  }

  // Behavior description
  const behavior = pickBehavior(anomalies);

  // Random micro-events (Part 4 — 25% chance per passenger)
  const microEvent = pickMicroEvent(anomalies, dayState);

  return {
    id,
    firstName,
    lastName,
    nation,
    sex,
    dob,
    height,
    weight,
    issueCity,
    passportCoverText: PASSPORT_COVER[nation] || nation.toUpperCase(),
    passportColor: PASSPORT_COLOR[nation] || '#1a2a5a',
    missingPassport,
    missingBoardingPass,
    passport: missingPassport ? null : {
      number: passNo,
      expiry,
      mrzL1,
      mrzL2,
      chip: {
        name:   `${lastName}, ${firstName}`,
        dob,
        nation,
        expiry,
        number: passNo,
        biohash: `BIO-${rand(10000,99999)}-${rand(10000,99999)}`,
      }
    },
    visa,
    boardingPass,
    biometrics,
    dbChecks,
    anomalies,
    behavior,
    microEvent,
    correctDecision: determineCorrectDecision(anomalies, nation, dayState),
  };
}

function generateBiometrics() {
  return {
    faceScore:   rand(88, 99),   // percent match — will be overridden if anomaly
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

function applyAnomaly(type, ctx) {
  const { firstName, lastName, biometrics, dbChecks, boardingPass, anomalies, visa, dayState } = ctx;

  const T = window.t || (k => k);
  switch (type) {
    case 'expired_passport': {
      const expDate = '2024.03.15';
      ctx.expiry = expDate;
      ctx.passport && (ctx.passport = { ...ctx.passport, expiry: expDate });
      anomalies.push({ type, severity: 'high', desc: `Passport expired ${expDate}`, i18n: { key:'anomaly.expired_passport', params:{date:expDate} } });
      break;
    }
    case 'chip_mismatch':
      biometrics.chipOk = false;
      biometrics.chipRead = 'MISMATCH';
      anomalies.push({ type, severity: 'high', desc: 'RFID chip data does not match printed passport fields', i18n: { key:'anomaly.chip_mismatch' } });
      break;

    case 'face_mismatch':
      biometrics.faceScore = rand(42, 62);
      biometrics.faceOk = false;
      anomalies.push({ type, severity: 'high', desc: `Low facial match: ${biometrics.faceScore}% (threshold: 80%)`, i18n: { key:'anomaly.face_mismatch', params:{score:biometrics.faceScore} } });
      break;

    case 'missing_visa':
      ctx.visa = null;
      dbChecks.visa = 'MISSING';
      anomalies.push({ type, severity: 'high', desc: 'No valid visa — entry permit required for this nationality', i18n: { key:'anomaly.missing_visa' } });
      break;

    case 'expired_visa': {
      const vExp = '2025.11.20';
      if (visa) { visa.expiry = vExp; dbChecks.visa = 'EXPIRED'; }
      anomalies.push({ type, severity: 'high', desc: `Visa expired ${vExp}`, i18n: { key:'anomaly.expired_visa', params:{date:vExp} } });
      break;
    }
    case 'watchlist_hit':
      dbChecks.interpol = 'HIT — LEVEL 2';
      anomalies.push({ type, severity: 'critical', desc: 'Interpol watchlist match — notify security', i18n: { key:'anomaly.watchlist_hit' } });
      break;

    case 'ees_overstay':
      dbChecks.ees = 'OVERSTAY — LAST EXIT MISSING';
      anomalies.push({ type, severity: 'high', desc: 'EES record shows prior overstay — no registered exit', i18n: { key:'anomaly.ees_overstay' } });
      break;

    case 'boarding_name_mismatch': {
      const rn = NAMES_BY_NATION[pick(NATIONS)];
      boardingPass.passengerName = `${pick(rn.last).toUpperCase()} ${pick(rn.M).toUpperCase()}`;
      anomalies.push({ type, severity: 'medium', desc: 'Boarding pass name does not match passport', i18n: { key:'anomaly.boarding_name_mismatch' } });
      break;
    }

    // ── PHASE 4: NEW EVENT ANOMALY TYPES ──────────────────────
    case 'contraband':
      dbChecks.national = 'CUSTOMS FLAG — UNDECLARED GOODS';
      anomalies.push({ type, severity: 'high', desc: 'Customs database flags undeclared contraband — refer to secondary inspection',
        i18n: { key: 'anomaly.contraband' } });
      break;

    case 'student_wrong_visa': {
      const wrongType = (visa && visa.type) || 'Type-C (Short Stay)';
      if (visa) visa.purpose = 'Tourism';
      anomalies.push({ type, severity: 'high', desc: `Student visa required — presented ${wrongType} (Tourism purpose declared)`,
        i18n: { key: 'anomaly.student_wrong_visa' } });
      break;
    }
  }
}

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.w;
    if (r <= 0) return item.v;
  }
  return items[items.length - 1].v;
}

function pickBehavior(anomalies) {
  const T = window.t || (k => k);
  if (anomalies.some(a => a.severity === 'critical')) return pick([T('behavior.critical1'), T('behavior.critical2')]);
  if (anomalies.some(a => a.severity === 'high'))     return pick([T('behavior.high1'), T('behavior.high2'), T('behavior.high3')]);
  return pick([T('behavior.normal1'), T('behavior.normal2'), T('behavior.normal3'), null, null]);
}

function pickMicroEvent(anomalies, dayState) {
  if (dayState.day < 2) return null;
  if (Math.random() > 0.30) return null;
  const events = [
    { type: 'bribe_offer',         amount: rand(50,200) },
    { type: 'diplomatic_immunity' },
    { type: 'lost_boarding_pass' },
    { type: 'nickname_mismatch' },
    // Phase 4 new event types
    { type: 'crying_family',       member: pick(['spouse','child','parent','sibling']) },
    { type: 'diplomatic_courier',  country: pick(['DEU','FRA','GRC','NLD']) },
    { type: 'medical_emergency',   condition: pick(['chest pain','severe allergic reaction','diabetic episode']) },
    { type: 'returning_citizen' },
  ];
  // Visibly ill only triggers if anomalies present and health alert active
  if (anomalies.length > 0 && dayState.day >= 3) {
    events.push({ type: 'visibly_ill' });
  }
  // Crying child
  events.push({ type: 'crying_child' });
  return pick(events);
}

function determineCorrectDecision(anomalies, nation, dayState) {
  const rules = window.getRulesForDay ? window.getRulesForDay(dayState.day) : null;

  // Banned nation check
  if (rules && rules.bannedNations && rules.bannedNations.includes(nation)) return 'deny';

  // Nation not yet allowed
  if (rules && rules.nations !== 'all' && !rules.nations.includes(nation)) return 'deny';

  // Interpol hit — day 12+ requires DETAIN, earlier requires DENY
  const watchlist = anomalies.find(a => a.type === 'watchlist_hit');
  if (watchlist) return (rules && rules.interpol === 'detain') ? 'detain' : 'detain';

  // EES overstay — day 10+ requires DETAIN
  const overstay = anomalies.find(a => a.type === 'ees_overstay');
  if (overstay) return (rules && rules.overstayDetain) ? 'detain' : 'deny';

  if (!anomalies.length) return 'approve';
  if (anomalies.some(a => a.severity === 'critical')) return 'detain';
  if (anomalies.some(a => a.severity === 'high'))     return 'deny';
  return 'deny';
}

// ── FAMILY SYSTEM ────────────────────────────────────────────
// Health states: healthy → hungry/cold → sick → critical → dead
const HEALTH_STATES = ['healthy','hungry','sick','critical','dead'];

const FAMILY_MEMBERS_INIT = [
  { id: 'spouse', name: 'Mirela',  relation: 'Spouse', health: 'healthy', sickDays: 0, alive: true },
  { id: 'child',  name: 'Anton',   relation: 'Son',    health: 'healthy', sickDays: 0, alive: true },
];

const EXPENSES = [
  { id: 'food',     label: 'Food',        cost: 20, icon: '◈', required: true,
    consequence: 'Family goes hungry → sick after 1 missed day' },
  { id: 'heat',     label: 'Heating',     cost: 15, icon: '◉', required: true,
    consequence: 'Family gets cold → sick after 1 missed day' },
  { id: 'medicine', label: 'Medicine',    cost: 30, icon: '✚', required: false,
    consequence: 'Sick members worsen → critical → die' },
];

function deepCopyFamily(members) {
  return members.map(m => ({ ...m }));
}

// ── SCORING CONSTANTS ─────────────────────────────────────────
const SCORE = {
  CORRECT_APPROVE:  10,
  CORRECT_DENY:     10,
  CORRECT_DETAIN:   15,  // bonus for catching criminals
  CORRECT_FLAG:      8,
  WRONG_APPROVE:    -10, // let a criminal/bad-doc through
  WRONG_DENY:        -5, // turned away a valid traveler
  WRONG_DETAIN:     -10, // false detention
  WRONG_FLAG:        -3,
  PENALTY_WARNING:   -5, // supervisor warning issued
  TERRORIST_CAUGHT: +25,
  TERRORIST_MISSED: -20,
};

// ── GAME STATE ────────────────────────────────────────────────
const GameState = {
  day:           1,
  time:          8 * 60,       // minutes since midnight
  money:         0,
  errors:        0,
  processed:     0,
  warnings:      0,            // supervisor warnings this shift
  passengers:    [],
  currentIndex:  0,
  current:       null,
  decisions:     [],           // { id, decision, correct, scoreChange }
  family: {
    members:     deepCopyFamily(FAMILY_MEMBERS_INIT),
    foodPaid:    true,
    heatPaid:    true,
    missedFood:  0,   // consecutive days food unpaid
    missedHeat:  0,   // consecutive days heat unpaid
  },
  score: {
    total:       0,
    streak:      0,   // consecutive correct decisions
    bestStreak:  0,
  },
  moral: {
    compassion:       0,
    loyalty:          0,
    corruption:       0,
    animusAlignment:  50,  // 0–100, starts neutral. >60 = allied, <20 = rejected
    animusTasksFollowed: 0,
  },
  dayActive:     false,
};

function startDay() {
  const count = rand(5, 8);
  GameState.passengers = [];
  passengerIdCounter = 0;
  for (let i = 0; i < count; i++) {
    GameState.passengers.push(generatePassenger(GameState));
  }
  // Inject story characters for this day
  if (window.injectStoryPassengers) {
    GameState.passengers = window.injectStoryPassengers(GameState.day, GameState.passengers);
  }
  GameState.currentIndex = 0;
  GameState.current      = null;
  GameState.dayActive    = true;
  GameState.time         = 8 * 60;
}

function nextPassenger() {
  if (GameState.currentIndex >= GameState.passengers.length) {
    endDay();
    return null;
  }
  const p = GameState.passengers[GameState.currentIndex];
  GameState.current = p;
  GameState.currentIndex++;
  // Advance simulated time
  GameState.time += TIME_PER_PASSENGER / 60;
  return p;
}

function recordDecision(decision) {
  const p = GameState.current;
  if (!p) return;

  const correct = decision === p.correctDecision;

  // Calculate score change
  let scoreChange = 0;
  if (correct) {
    const key = `CORRECT_${decision.toUpperCase()}`;
    scoreChange = SCORE[key] || SCORE.CORRECT_APPROVE;
    GameState.score.streak++;
    if (GameState.score.streak >= 3) scoreChange += 3;
    if (GameState.score.streak > GameState.score.bestStreak) {
      GameState.score.bestStreak = GameState.score.streak;
    }
    // Loyalty salary bonus
    if (window.getMoralityModifiers && window.getMoralityModifiers().loyaltyBonus) {
      scoreChange += 2;
    }
  } else {
    const key = `WRONG_${decision.toUpperCase()}`;
    scoreChange = SCORE[key] || SCORE.WRONG_APPROVE;
    GameState.score.streak = 0;
    GameState.errors++;
    GameState.warnings++;
  }

  // Terrorist special scoring
  const isTerrorist = p.anomalies.some(a => a.type === 'terrorist');
  if (isTerrorist && decision === 'detain') scoreChange += SCORE.TERRORIST_CAUGHT;
  if (isTerrorist && decision === 'approve') scoreChange += SCORE.TERRORIST_MISSED;

  GameState.score.total += scoreChange;
  GameState.money = Math.max(0, GameState.money + (correct ? SALARY_PER_CORRECT : PENALTY_PER_MISTAKE * -1));
  GameState.processed++;

  GameState.decisions.push({ id: p.id, decision, correct, scoreChange, passenger: p });

  // Moral tracking
  if (decision === 'approve' && p.anomalies.length > 0) GameState.moral.compassion++;
  if (decision === 'deny'    && p.anomalies.length === 0) GameState.moral.loyalty++;
  if (decision === 'detain'  && p.anomalies.some(a => a.type === 'watchlist_hit')) GameState.moral.loyalty += 2;

  updateHUD();
  if (window.saveGame) window.saveGame();
  return { correct, scoreChange, passenger: p };
}

// ── FAMILY CONSEQUENCE ENGINE ─────────────────────────────────
function applyDayConsequences(paid) {
  // paid = { food: bool, heat: bool, medicine: bool }
  const fam = GameState.family;

  fam.foodPaid = paid.food;
  fam.heatPaid = paid.heat;

  if (!paid.food) fam.missedFood++;
  else            fam.missedFood = 0;

  if (!paid.heat) fam.missedHeat++;
  else            fam.missedHeat = 0;

  fam.members.forEach(m => {
    if (!m.alive) return;

    // Determine new health based on what was paid
    const hungry = !paid.food;
    const cold   = !paid.heat;

    if (m.health === 'healthy') {
      if (hungry || cold) m.health = hungry ? 'hungry' : 'cold';
    } else if (m.health === 'hungry' || m.health === 'cold') {
      // Second missed day → sick
      if (hungry || cold) { m.health = 'sick'; m.sickDays = 1; }
      else                   m.health = 'healthy';
    } else if (m.health === 'sick') {
      m.sickDays++;
      if (!paid.medicine) {
        if (m.sickDays >= 2) m.health = 'critical';
      } else {
        m.health = 'healthy'; m.sickDays = 0;
      }
    } else if (m.health === 'critical') {
      if (!paid.medicine) { m.health = 'dead'; m.alive = false; }
      else                  m.health = 'sick';
    }
  });
}

function needsMedicine() {
  return GameState.family.members.some(m => m.alive && (m.health === 'sick' || m.health === 'critical'));
}

function getFamilyMemberCount() {
  return GameState.family.members.filter(m => m.alive).length;
}

function endDay() {
  GameState.dayActive = false;
  showDaySummary();
}

// ── HUD UPDATE ────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('stat-day').textContent       = GameState.day;
  const h = Math.floor(GameState.time / 60);
  const m = GameState.time % 60;
  document.getElementById('stat-time').textContent      = `${padZ(h,2)}:${padZ(m,2)}`;
  document.getElementById('stat-processed').textContent = GameState.processed;
  document.getElementById('stat-errors').textContent    = GameState.errors;
  document.getElementById('stat-money').textContent     = `€${GameState.money}`;

  const moneyEl = document.getElementById('stat-money');
  moneyEl.className = 'value ' + (GameState.money >= 50 ? 'green' : GameState.money >= 20 ? 'yellow' : 'red');
  if (window.triggerMoneyTick) window.triggerMoneyTick();

  const scoreEl = document.getElementById('stat-score');
  if (scoreEl) {
    scoreEl.textContent = GameState.score.total;
    scoreEl.className   = 'value ' + (GameState.score.total >= 0 ? '' : 'red');
  }

  const streakEl  = document.getElementById('streak-val');
  const streakDiv = document.getElementById('streak-display');
  if (streakEl) streakEl.textContent = GameState.score.streak;
  if (streakDiv) streakDiv.classList.toggle('active', GameState.score.streak >= 3);

  // Morality bars
  if (window.StoryState) {
    const ss = window.StoryState;
    const bars = [
      { bar: 'moral-compassion-bar', val: 'moral-compassion-val', v: ss.compassion },
      { bar: 'moral-loyalty-bar',    val: 'moral-loyalty-val',    v: ss.loyalty    },
      { bar: 'moral-corruption-bar', val: 'moral-corruption-val', v: ss.corruption },
    ];
    bars.forEach(({ bar, val, v }) => {
      const b = document.getElementById(bar);
      const l = document.getElementById(val);
      if (b) b.style.width = Math.min(v, 100) + '%';
      if (l) l.textContent = v;
    });
  }

  // PHANTOM indicator — show only after first contact
  if (window.StoryState && window.StoryState.phantom.contacted) {
    const phantomEl  = document.getElementById('phantom-indicator');
    const phantomVal = document.getElementById('stat-phantom');
    if (phantomEl)  phantomEl.style.display = 'flex';
    if (phantomVal) {
      const t = window.StoryState.phantom.trust;
      phantomVal.textContent = t > 60 ? 'TRUSTED' : t > 30 ? 'WATCHING' : 'CAUTIOUS';
      phantomVal.style.color = t > 60 ? 'var(--green)' : t > 30 ? '#c0a0ff' : 'var(--text-dim)';
    }
  }
}

// ── INIT ──────────────────────────────────────────────────────
// Attach to window so UI layer can call
window.GameState          = GameState;
window.startDay           = startDay;
window.nextPassenger      = nextPassenger;
window.recordDecision     = recordDecision;
window.applyDayConsequences = applyDayConsequences;
window.needsMedicine      = needsMedicine;
window.getFamilyMemberCount = getFamilyMemberCount;
window.EXPENSES           = EXPENSES;
window.SCORE              = SCORE;
window.VISA_REQUIRED      = VISA_REQUIRED;
window._genMRZ            = genMRZ;

// ── SAVE / LOAD SYSTEM ─────────────────────────────────────────
window.saveGame = function saveGame() {
  const data = {
    v: 1,
    gs: {
      day:       GameState.day,
      money:     GameState.money,
      errors:    GameState.errors,
      processed: GameState.processed,
      warnings:  GameState.warnings,
      score:  { total: GameState.score.total, streak: GameState.score.streak, bestStreak: GameState.score.bestStreak },
      moral:  { compassion: GameState.moral.compassion, loyalty: GameState.moral.loyalty, corruption: GameState.moral.corruption, animusAlignment: GameState.moral.animusAlignment, animusTasksFollowed: GameState.moral.animusTasksFollowed },
      family: {
        members:    GameState.family.members.map(m => ({ ...m })),
        foodPaid:   GameState.family.foodPaid,
        heatPaid:   GameState.family.heatPaid,
        missedFood: GameState.family.missedFood,
        missedHeat: GameState.family.missedHeat,
      },
    },
    ss: window.StoryState ? JSON.parse(JSON.stringify(window.StoryState)) : null,
  };
  try { localStorage.setItem('chk_save', JSON.stringify(data)); } catch(e) {}
};

window.loadSave = function loadSave() {
  try {
    const raw = localStorage.getItem('chk_save');
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return false;
    const g = d.gs;
    GameState.day       = g.day;
    GameState.money     = g.money;
    GameState.errors    = g.errors;
    GameState.processed = g.processed;
    GameState.warnings  = g.warnings;
    Object.assign(GameState.score,  g.score);
    Object.assign(GameState.moral,  g.moral);
    GameState.family.members    = g.family.members.map(m => ({ ...m }));
    GameState.family.foodPaid   = g.family.foodPaid;
    GameState.family.heatPaid   = g.family.heatPaid;
    GameState.family.missedFood = g.family.missedFood;
    GameState.family.missedHeat = g.family.missedHeat;
    if (d.ss && window.StoryState) {
      const ss = window.StoryState;
      ss.memory      = d.ss.memory;
      ss.phantom     = d.ss.phantom;
      ss.animus      = d.ss.animus || ss.animus; // preserve defaults if not in old saves
      ss.compassion  = d.ss.compassion;
      ss.loyalty     = d.ss.loyalty;
      ss.corruption  = d.ss.corruption;
      ss.flags       = d.ss.flags;
      ss.dayDialogues= d.ss.dayDialogues;
      ss.bribes      = d.ss.bribes;
    }
    return true;
  } catch(e) { return false; }
};

window.hasSave  = function() { try { return !!localStorage.getItem('chk_save'); } catch(e) { return false; } };
window.clearSave= function() { try { localStorage.removeItem('chk_save'); } catch(e) {} };

console.log('[CHECKPOINT] Game engine loaded.');
