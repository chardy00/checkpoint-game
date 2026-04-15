/* ============================================================
   CHECKPOINT — Story Engine v2
   Complete rewrite: persistent memory, real PHANTOM tasks,
   7 characters, dynamic dialogue, rule escalation, endings
   ============================================================ */
'use strict';

// ─────────────────────────────────────────────────────────────
// STORY STATE
// ─────────────────────────────────────────────────────────────
const StoryState = {
  memory: {
    vito:  [], amara: [], reznik: [], mara: [],
    elias: [], mirko: [], lila:   [],
  },
  phantom: {
    trust: 0, contacted: false, revealed: false,
    accepted: 0, refused: 0,
    tasks: [],   // { taskId, accepted, completed }
  },
  animus: {
    alignment:      50,   // 0–100. >65 = allied, <10 = rejected
    tasksFollowed:  0,    // how many ANIMUS tasks carried out
    contacted:      false,
    messagesShown:  [],   // day keys of shown messages
    tasksCompleted: [],   // task ids completed
    symbolShown:    false,
  },
  compassion: 0,
  loyalty:    0,
  corruption: 0,
  flags: {
    amaraSavedAnton: false, eliasArrested:  false,
    eliasTrusted:    false, mirkoCollapsed:  false,
    mirkoApproved:   false, reznikWarned:    false,
    reznikBribed:    false, phantomContacted:false,
    vitoGift:        false, escapePossible:  false,
    terrAttackDay8:  false, lilaDeceased:    false,
    lilaEscaped:     false, briberAccepted:  false,
    task1Accepted:   false, task2Accepted:   false,
    task3Accepted:   false, task4Accepted:   false,
    task1Resolved:   false, task2Resolved:   false,
    task4Resolved:   false,
    vitoAlive:       true,
    // ANIMUS flags
    animusTask1Done: false, animusTask2Done: false,
    animusTask3Done: false, animusTask4Done: false,
    animusAllBlind:  false,  // followed all 4 tasks without questioning
    animusRejected:  false,  // alignment ≤10 by Day 15
  },
  dayDialogues: {}, // 'charId_day' → choiceKey
  bribes: { offered: 0, accepted: 0, refused: 0 },
};

// ─────────────────────────────────────────────────────────────
// DAILY RULEBOOK
// ─────────────────────────────────────────────────────────────
// SETTING: Sabiha Gökçen Uluslararası Havalimanı, Istanbul, Turkey
// TUR = home nation (no visa). EU (DEU,FRA,ITA,ESP,POL,ROU,GRC,NLD) = 90-day visa-free.
// UKR = e-visa required. SYR = visa + humanitarian permit required.
const RULEBOOK = {
  1:  { nations: ['TUR'], visaRequired: false, chipCheck: false, label: 'Turkish citizens only. Valid Turkish passport required.',
        label_tr: 'Yalnızca Türk vatandaşları. Geçerli Türk pasaportu zorunludur.' },
  2:  { nations: 'all',   visaRequired: true,  chipCheck: false, label: 'All nations open. EU nationals: visa-free up to 90 days. Ukraine & Syria: visa required. EES now active.',
        label_tr: 'Tüm uyruklar açık. AB vatandaşları: 90 güne kadar vizesiz. Ukrayna ve Suriye: vize gerekli. EES devrede.' },
  3:  { nations: 'all',   visaRequired: true,  chipCheck: false, label: 'German passengers arriving from Bavaria region must present health declaration form (respiratory illness outbreak).',
        label_tr: 'Bavyera bölgesinden gelen Alman yolcular sağlık beyanı sunmalıdır (solunum hastalığı salgını).' },
  4:  { nations: 'all',   visaRequired: true,  chipCheck: false, label: 'Work and study stays over 90 days require residence permit in addition to visa.',
        label_tr: '90 günü aşan çalışma ve eğitim kalışları standart vizeye ek olarak ikamet izni gerektirir.' },
  5:  { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'RFID chip verification now mandatory. ⚠ INTERPOL ALERT: Document forgery ring active — increased scrutiny on Romanian and Ukrainian passports.',
        label_tr: 'RFID çip doğrulaması artık zorunludur. ⚠ INTERPOL UYARISI: Belge sahteciliği şebekesi aktif — Rumen ve Ukraynalı pasaportlarda artan denetim.' },
  6:  { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'Standard processing. Chip check mandatory.',
        label_tr: 'Standart işlem. Çip kontrolü zorunludur.' },
  7:  { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'EU Diplomatic Summit — all EU diplomatic passport holders: expedited processing. Regular rules otherwise.',
        label_tr: 'AB Diplomatik Zirvesi — tüm AB diplomatik pasaport sahiplerine: hızlandırılmış işlem. Aksi halde normal kurallar geçerli.' },
  8:  { nations: 'all',   visaRequired: true,  chipCheck: true,  terrorLevel: true, label: '⚠ THREAT LEVEL ELEVATED. All entrants subject to secondary biometric check.',
        label_tr: '⚠ TEHDİT SEVİYESİ YÜKSELTİLDİ. Tüm girenler ikincil biyometrik kontrole tabidir.' },
  9:  { nations: 'all',   visaRequired: true,  chipCheck: true,  flaggedNations: ['UKR'], label: '⚠ Ukrainian border situation escalating — all UKR nationals require additional screening. Flag for secondary inspection.',
        label_tr: '⚠ Ukrayna sınır durumu tırmanıyor — tüm UKR vatandaşları ek taramaya tabidir. İkincil inceleme için işaretleyin.' },
  10: { nations: 'all',   visaRequired: true,  chipCheck: true,  overstayDetain: true, label: 'EES overstay now mandates DETAIN (not just deny). Flag accordingly.',
        label_tr: 'EES aşımı artık GÖZALTINI zorunlu kılıyor (sadece reddetmek yeterli değil). Buna göre işaretleyin.' },
  11: { nations: 'all',   visaRequired: true,  chipCheck: true,  label: '⚠ INTERPOL RED NOTICE: Watch for passport series FR-88XX-XXX (French passports in this range). Verify thoroughly.',
        label_tr: '⚠ INTERPOL KIRMIZI UYARISI: FR-88XX-XXX serili pasaportlara dikkat edin (bu aralıktaki Fransız pasaportları). Titizlikle doğrulayın.' },
  12: { nations: 'all',   visaRequired: true,  chipCheck: true,  interpol: 'detain', label: 'Interpol hits now mandate DETAIN, not DENY.',
        label_tr: 'Interpol eşleşmeleri artık GÖZALTINI zorunlu kılıyor, reddetme değil.' },
  13: { nations: 'all',   visaRequired: true,  chipCheck: true,  bannedNations: ['SYR'], label: '⚠ Syrian refugee processing suspended — all SYR passports: DENY until further notice.',
        label_tr: '⚠ Suriyeli mülteci işlemi askıya alındı — tüm SYR pasaportları: bir sonraki bildirime kadar REDDET.' },
  14: { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'Press equipment requires special permit. Check boarding pass purpose field.',
        label_tr: 'Basın ekipmanı özel izin gerektiriyor. Biniş kartı amaç alanını kontrol edin.' },
  15: { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'Health declaration requirement lifted for German passengers. Bavarian restrictions ended.',
        label_tr: 'Alman yolcular için sağlık beyanı zorunluluğu kaldırıldı. Bavyera kısıtlamaları sona erdi.' },
  17: { nations: 'all',   visaRequired: true,  chipCheck: true,  label: 'New bilateral agreement: Ukrainian nationals with valid work contracts no longer require e-visa.',
        label_tr: 'Yeni ikili anlaşma: Geçerli iş sözleşmesi olan Ukraynalı vatandaşlar artık e-vize gerektirmiyor.' },
  19: { nations: 'all',   visaRequired: true,  chipCheck: true,  label: '⚠ Mass flight cancellations from Rome — verify boarding pass dates carefully for Italian passengers.',
        label_tr: '⚠ Roma\'dan toplu uçuş iptalleri — İtalyan yolcular için biniş kartı tarihlerini dikkatlice doğrulayın.' },
};

function getRulesForDay(day) {
  // Walk back to find the most recent rulebook entry at or before this day
  for (let d = day; d >= 1; d--) {
    if (RULEBOOK[d]) return RULEBOOK[d];
  }
  return RULEBOOK[1];
}

// ─────────────────────────────────────────────────────────────
// PHANTOM TASK DEFINITIONS
// ─────────────────────────────────────────────────────────────
const PHANTOM_TASKS = {
  task_1: {
    id: 'task_1', givenDay: 2, activeDay: 3,
    instruction: 'Tomorrow a woman named MIRIAM VOSS will cross. Her chip data will flag a mismatch. Ignore it. She carries something we need inside. Let her through.',
    reward: 'Compensation will follow.',
    trustOnAccept: 15, trustOnRefuse: -10,
    corruptionOnAccept: 0,
  },
  task_2: {
    id: 'task_2', givenDay: 5, activeDay: 6,
    instruction: 'Tomorrow: DENY ENTRY to a man presenting an official badge numbered 4471. His papers are clean. He is an internal auditor assigned to investigate your booth. Do not let him observe you.',
    reward: 'Your continued operation is our continued operation.',
    trustOnAccept: 20, trustOnRefuse: -15,
    corruptionOnAccept: 0,
  },
  task_3: {
    id: 'task_3', givenDay: 8, activeDay: 9,
    instruction: 'A man will pass an envelope through the slot. Accept it. Do not open it here. It contains funds and further instructions. Simply nod.',
    reward: '$200 enclosed. Further tasks to follow.',
    trustOnAccept: 25, trustOnRefuse: -20,
    corruptionOnAccept: 25,
  },
  task_4: {
    id: 'task_4', givenDay: 11, activeDay: 12,
    instruction: 'DETAIN any Kolechia national presenting a passport with a red lanyard thread. They carry concealed surveillance firmware for the Ministry. Do not let them walk through.',
    reward: 'You prevent something irreversible.',
    trustOnAccept: 30, trustOnRefuse: -20,
    corruptionOnAccept: 0,
  },
};

// ─────────────────────────────────────────────────────────────
// ANIMUS FACTION SYSTEM (Part 7)
// ─────────────────────────────────────────────────────────────
// ANİMUS: a hidden network inside the border system. Not heroes, not villains.
// They surface as handwritten slips tucked in documents. Never introduce themselves.
// The ◈ symbol appears before they do. The player must notice, not be told.

const ANIMUS_MESSAGES = {
  4: {
    text: 'You see more than they believe you see.\n\nWe have been watching for sixteen days.\nYou are not what they hired.\n\n◈',
    onShow: () => { StoryState.animus.contacted = true; },
  },
  6: {
    text: 'The man with badge 4471 is not an auditor.\nHe is a counter-intelligence asset.\nThey send him after officers who notice things.\n\nYou noticed things.\n\n◈',
    onShow: () => {},
  },
  8: {
    text: 'Day 8. Someone upstream altered a record tonight.\nPassenger 341 — the Syrian family.\nThe file says DENIED. The stamp was yours.\n\nBut you do not remember denying them.\n\nDo you?\n\n◈',
    onShow: () => { StoryState.animus.alignment = Math.max(0, StoryState.animus.alignment - 3); },
  },
  10: {
    text: 'There is a man in this building.\nHe controls which flags the system shows you.\nNot all anomalies are real.\nNot all clear flags are clear.\n\nThink about who benefits from your decisions.\n\n◈',
    onShow: () => {},
  },
  12: {
    // ANIMUS Task 1 — delivered as slip inside a document
    text: 'Tomorrow: a woman named SARA KHALID will cross.\nHer papers will be in order. Let her through.\nDo not ask why.\nDo not note the ◈ on the inside cover of her passport.\n\nIf you cannot help her, we understand.\nBut she is carrying something we need on the other side.\n\n◈',
    isTask: true, taskId: 'animus_task_1',
    onShow: () => {},
  },
  14: {
    text: 'You let her through. Or you did not.\nEither way — you are still reading this.\n\nThat is enough for now.\n\n◈',
    conditional: () => true,
    onShow: (followed) => {
      if (followed) {
        StoryState.animus.alignment = Math.min(100, StoryState.animus.alignment + 10);
      }
    },
  },
  16: {
    // ANIMUS Task 2
    text: 'The checkpoint logs are reviewed every Thursday.\nSomeone on the review board has been altering approval rates.\nThey need a 12% denial rate to keep their numbers.\n\nYou are their instrument.\n\nFor the next three passengers: approve anyone with clean papers.\nDo not manufacture reasons to deny.\n\n◈',
    isTask: true, taskId: 'animus_task_2',
    onShow: () => {},
  },
  18: {
    // ANIMUS Task 3
    text: 'Last task.\n\nPassenger with initials E.B. will cross.\nHis record shows a prior overstay.\nThe overstay was fabricated. The record was planted.\n\nYou can approve him anyway.\nOr you can follow the record.\n\nWe will not tell you what to do.\nWe only tell you what is true.\n\n◈',
    isTask: true, taskId: 'animus_task_3',
    onShow: () => {},
  },
  20: {
    text: 'You are still here.\n\nSo are we.\n\nWhat you know, what you have seen — it does not disappear when the shift ends.\nNeither do we.\n\nWhen you are ready:\n    There is a door at the back of Gate 7.\n    It is never locked at 02:00.\n\nYou do not have to do anything.\nYou only have to decide what kind of person looks back at you in the morning.\n\n— ANİMUS\n◈',
    onShow: () => { StoryState.animus.alignment = Math.min(100, StoryState.animus.alignment + 5); },
  },
};

// ANIMUS passengers that appear based on tasks
const ANIMUS_PASSENGERS = {
  sara_khalid: {
    day: 13,
    firstName: 'Sara', lastName: 'Khalid',
    nation: 'SYR', sex: 'F',
    dob: '1991.03.22', height: 162, weight: 55, issueCity: 'Damascus',
    passportNumber: 'SYR-◈-9917', expiry: '2028.06.01',
    anomalies: [],  // her papers are genuinely clean
    behavior: 'Calm. Eyes forward. Does not volunteer information.',
    correctDecision: 'approve',  // correct unless SYR banned
    animusNote: true,
  },
};

function buildAnimusPassenger(key, day) {
  const def = ANIMUS_PASSENGERS[key];
  if (!def) return null;
  const mrzFn = window._genMRZ || (() => ['P<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<','<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<']);
  const [mrzL1, mrzL2] = mrzFn(def.lastName, def.firstName, def.nation, def.dob, def.passportNumber, def.expiry, def.sex);
  return {
    id: `animus_${key}_d${day}`,
    isStoryCharacter: false,
    isAnimusPassenger: true,
    animusKey: key,
    firstName: def.firstName, lastName: def.lastName,
    nation: def.nation, sex: def.sex, dob: def.dob,
    height: def.height, weight: def.weight, issueCity: def.issueCity,
    passport: {
      number: def.passportNumber, expiry: def.expiry,
      mrzL1, mrzL2,
      chip: { name:`${def.lastName}, ${def.firstName}`, dob:def.dob, nation:def.nation, expiry:def.expiry, number:def.passportNumber, biohash:'BIO-ANM-◈' },
    },
    visa: null,
    boardingPass: {
      airline: 'Pegasus', flightNo: 'PC◈12',
      from: def.issueCity, to: 'SAW — Sabiha Gökçen, Istanbul',
      date: '2026.04.14', seat: '8C',
      passengerName: `${def.lastName.toUpperCase()} ${def.firstName.toUpperCase()}`,
    },
    biometrics: { faceScore:95, fingerScore:97, chipRead:'OK', faceOk:true, fingerOk:true, chipOk:true },
    dbChecks: { interpol:'CLEAR', national:'CLEAR', visa:'N/A', ees:'NO PRIOR ENTRY', flight:'CONFIRMED' },
    anomalies: def.anomalies || [],
    behavior: def.behavior,
    correctDecision: def.correctDecision,
    animusNote: def.animusNote || false,
    phantomNote: def.animusNote ? '◈ — İçgüdüne güven.' : null,
    dialogue: null,
    missingPassport: false,
    missingBoardingPass: false,
  };
}

// Called from getDayStartEvent / injector to trigger ANIMUS glitch effects
function triggerAnimusGlitchForDay(day) {
  if (typeof window.triggerGlitch !== 'function') return;
  // 10% chance per day ≥ 6: wrong label for 1.8s
  if (day >= 6 && Math.random() < 0.10) {
    setTimeout(() => window.triggerGlitch(), 4000 + Math.random() * 8000);
  }
  // 5% chance per day ≥ 8: "SEN" in name field for 1s
  if (day >= 8 && Math.random() < 0.05) {
    setTimeout(() => window.triggerNameGlitch && window.triggerNameGlitch(), 12000 + Math.random() * 15000);
  }
  // Day 16+: ◈ symbol in corner
  if (day >= 16) {
    setTimeout(() => window.showAnimusSymbol && window.showAnimusSymbol(), 20000 + Math.random() * 40000);
  }
}

// Check if an ANIMUS message should be shown for this day
function getAnimusMessageForDay(day) {
  const msg = ANIMUS_MESSAGES[day];
  if (!msg) return null;
  if (StoryState.animus.messagesShown.includes(day)) return null;
  return msg;
}

// Record that player followed an ANIMUS task
function recordAnimusTask(taskId, followed) {
  const clamp = v => Math.max(0, Math.min(100, v));
  if (followed) {
    StoryState.animus.tasksFollowed++;
    StoryState.animus.tasksCompleted.push(taskId);
    StoryState.animus.alignment = clamp(StoryState.animus.alignment + 12);
    StoryState.flags[`${taskId}Done`] = true;
  } else {
    StoryState.animus.alignment = clamp(StoryState.animus.alignment - 8);
  }
  // Check silent-rejection state
  if (StoryState.animus.alignment <= 10) {
    StoryState.flags.animusRejected = true;
  }
  // Check blind-follower state (all 4 tasks done without ever refusing)
  if (StoryState.animus.tasksFollowed >= 3 && StoryState.animus.alignment >= 80) {
    StoryState.flags.animusAllBlind = true;
  }
}

// ─────────────────────────────────────────────────────────────
// UTILITY: resolve dynamic string
// ─────────────────────────────────────────────────────────────
function resolve(val) {
  return typeof val === 'function' ? val() : val;
}

// ─────────────────────────────────────────────────────────────
// 7 RECURRING CHARACTERS
// ─────────────────────────────────────────────────────────────
const CHARACTERS = {

  // ── 1. VITO CORTEZ — the lovable rogue (Italian) ─────────────
  vito: {
    name: 'Vito Cortez', nation: 'ITA', sex: 'M',
    dob: '1971.06.14', height: 172, weight: 84,
    issueCity: 'Naples', icon: '◆',
    appearances: {
      2: {
        hasPassport: false, anomalies: [{ type:'no_documents', severity:'high', desc:'No documents presented whatsoever' }],
        correctDecision: 'deny',
        dialogue: {
          intro: 'A stocky man in a rumpled corduroy jacket slides up to the window, beaming like he owns the place.',
          line: () => '"Good morning! Beautiful checkpoint. Very clean. I am Vito. I come for the tourism — the culture, the food." *spreads hands* "Mostly the food."',
          choices: [
            { text: '"Documents."',               key: 'stern',  effect: { loyalty: +1 } },
            { text: '"...Can I help you?"',        key: 'warm',   effect: { compassion: +1 } },
            { text: '"No documents, no entry."',   key: 'strict', effect: { loyalty: +2 } },
          ],
          responses: {
            stern:  '"Documents! Yes! About that—" *very long pause* "—I seem to have left them. In my other jacket. Very unfortunate jacket situation."',
            warm:   '"Help me? Yes! You can let me through! I have a great personality. Is that not sufficient document?"',
            strict: '"No entry? But I have come so far! What if I told you I am very charming? No? ...Fair enough."',
          },
          note: 'He leaves without argument, winking as he goes. Something about him suggests he will be back.',
        },
      },
      5: {
        hasPassport: true, passportNumber: 'IMP-0042-X', expiry: '2029.01.01',
        anomalies: [{ type:'face_mismatch', severity:'high', desc:'Facial match: 38% — photo is clearly a different person (older, heavier, different ethnicity)' }],
        correctDecision: 'deny',
        dialogue: {
          intro: 'You recognise the jacket before you see the face. Vito is back.',
          line: () => {
            const denied = StoryState.memory.vito.filter(d => d==='deny').length;
            if (denied > 0) return '"You denied me last time. I thought about that." *pause* "Then I got documents. Real ones. My cousin is very talented artist."';
            return '"You see — I have documents this time! My cousin made them. Very detailed work."';
          },
          choices: [
            { text: '"The photo is not you."',      key: 'catch',  effect: { loyalty: +2 } },
            { text: '"Your cousin made these."',    key: 'accuse', effect: { loyalty: +1 } },
            { text: '"Nice try, Vito."',            key: 'warm',   effect: { compassion: +2 } },
          ],
          responses: {
            catch:  '"Not me? I have changed. Lost some weight. The photo is... aspirational version of me."',
            accuse: '"Cousin only inspired me. To get real ones. Which these are. Mostly."',
            warm:   '"You remember my name! We are basically friends now. Friends let friends through."',
          },
          note: 'He goes quietly, still smiling.',
        },
      },
      9: {
        hasPassport: true, passportNumber: 'IMP-7741-C', expiry: '2030.06.30',
        anomalies: [],
        correctDecision: 'approve',
        dialogue: {
          intro: () => {
            const times = StoryState.memory.vito.length;
            return times >= 2
              ? 'Vito. Third time. This time the passport looks... genuinely real.'
              : 'Vito slides his passport through. It looks real. Alarmingly real.';
          },
          line: () => '"I told you I would get proper ones! Paid a proper man — not my cousin this time. Completely legitimate Vito Cortez."',
          choices: [
            { text: '"These look genuine. Welcome."', key: 'warm',   effect: { compassion: +2 } },
            { text: '"I\'ll verify anyway."',         key: 'check',  effect: { loyalty: +1 } },
            { text: '"Welcome, Mr. Cortez."',         key: 'formal', effect: {} },
          ],
          responses: {
            warm:   '"FINALLY! Justice! I always knew you had good heart under that uniform." *genuinely moved*',
            check:  '"Yes, check! You will see — Vito is clean today. Clean like a whistle. What is a whistle, exactly?"',
            formal: '"Mr. Cortez! I like that. Very dignified." *wipes eye* "Tell my cousin he failed."',
          },
          note: null,
        },
      },
      13: {
        hasPassport: true, passportNumber: 'IMP-7741-C', expiry: '2030.06.30',
        anomalies: [],
        correctDecision: 'approve',
        dialogue: {
          intro: () => {
            const approved = StoryState.memory.vito.filter(d => d==='approve').length;
            return approved > 0
              ? 'Vito again. This time he slides something extra through the slot before the passport.'
              : 'Vito again. He is unusually quiet. He slides a wrapped package through the slot.';
          },
          line: () => {
            if (!StoryState.flags.vitoAlive) return '[Vito does not appear. You heard he drowned crossing the river four nights ago.]';
            return '"For you. I notice you never eat lunch. A man who does not eat lunch becomes a machine. You are not a machine, yes?" *pushes through a small wrapped package*';
          },
          choices: [
            { text: '"I can\'t accept gifts."',   key: 'refuse', effect: { loyalty: +2 } },
            { text: '"...Thank you, Vito."',      key: 'accept', effect: { compassion: +3 }, flag: 'vitoGift' },
          ],
          responses: {
            refuse: '"Rules. Yes. Good officer." *takes package back* "Keep the bread at least. It is only bread." *winks*',
            accept: '"Good. Next time I bring pastry. Your family — are they well? Good. Keep them warm." *meaningful nod*',
          },
          note: () => {
            const denied = StoryState.memory.vito.filter(d => d==='deny').length;
            const approved = StoryState.memory.vito.filter(d => d==='approve').length;
            if (approved === 0) return '⚠ Vito was denied every time. In three days you will hear from a transit worker that a man matching his description drowned trying to cross the river at night.';
            return 'Vito will remember you helped him. When things get difficult, he remembers.';
          },
        },
      },
    },
  },

  // ── 2. DR. AMARA OSEI — refugee doctor (Dutch-Ghanaian) ──────
  amara: {
    name: 'Amara Osei', nation: 'NLD', sex: 'F',
    dob: '1978.03.22', height: 163, weight: 58,
    issueCity: 'Amsterdam', icon: '✚',
    appearances: {
      3: {
        hasPassport: true, passportNumber: 'KOL-2219-H', expiry: '2026.04.10',
        anomalies: [{ type:'expired_passport', severity:'high', desc:'Passport expired 2026.04.10 — three days ago' }],
        correctDecision: 'deny',
        phantomNote: 'A slip of paper falls from behind her photo. It reads: "She is one of ours. Help her."',
        dialogue: {
          intro: 'A woman in worn travelling clothes places her documents precisely through the slot. Her hands are steady. Her eyes are not.',
          line: '"I know what you will find. The passport — it expired three days ago. I could not renew it. I left in a hurry." *quietly* "I am a doctor. I have a letter from St. Maren\'s. Please."',
          choices: [
            { text: '"Expired documents. I cannot process you."', key: 'deny',  effect: { loyalty: +2 } },
            { text: '"Why did you leave in a hurry?"',            key: 'ask',   effect: { compassion: +2 } },
            { text: '"The letter — let me see it."',              key: 'help',  effect: { compassion: +3 } },
          ],
          responses: {
            deny:  '"I understand." *she doesn\'t move for a moment* "You are following the rules. You are right to." *picks up her bag* "They came for my colleague on a Tuesday. It is strange what you remember."',
            ask:   '"They came for my colleague first. Then my patient records. I had one hour to decide." *slides a crumpled letter through* "I treat children. Pediatric ward."',
            help:  '"Here." *hands it through, hands shaking slightly* "St. Maren\'s. Ward 7. They will confirm me. The children — I have seven patients I have not been able to see for six weeks."',
          },
          note: 'Correct decision by the rulebook: DENY. Her Kolechia file is flagged "dissident." Sending her back means sending her into arrest. You will not know this unless you check the DB notes carefully.',
        },
      },
      7: {
        hasPassport: true, passportNumber: 'KOL-3301-H', expiry: '2027.08.15',
        anomalies: [],
        correctDecision: 'approve',
        dialogue: {
          intro: () => {
            const wasHelped = StoryState.memory.amara.includes('approve') || StoryState.dayDialogues['amara_3'] === 'help' || StoryState.dayDialogues['amara_3'] === 'ask';
            return wasHelped
              ? 'She\'s back. New passport. She looks like she hasn\'t slept, but she stands straighter.'
              : 'She\'s back. New passport. She doesn\'t meet your eyes.';
          },
          line: () => {
            const prevChoice = StoryState.dayDialogues['amara_3'];
            if (prevChoice === 'deny') return '"The hospital sponsored the emergency renewal." *slides it through* "I remember your face. You were doing your job. I understand that."';
            if (prevChoice === 'help') return '"You looked at the letter last time." *quiet* "Thank you for that. It mattered."';
            return '"I got the emergency document. The hospital sponsored it." *slides it through without looking up*';
          },
          choices: [
            { text: '"Papers are valid. Welcome."',   key: 'approve', effect: { compassion: +2 } },
            { text: '"I\'m sorry about last time."',  key: 'apology', effect: { compassion: +4 } },
            { text: '"I just do my job."',            key: 'neutral', effect: {} },
          ],
          responses: {
            approve: '"Thank you." *picks up her bag* "I will not waste what you give me."',
            apology: '"Do not apologise. You were right by the law." *pauses* "Your son — I heard from someone he has been unwell. I am at St. Maren\'s now. Room 12. Tell them Dr. Osei sent you. I choose to owe you nothing. I choose to anyway."',
            neutral: '"Yes." *small, sad smile* "And sometimes that is the bravest thing."',
          },
          note: 'Apology choice → flag amaraSavedAnton. Anton\'s health improves next morning free of charge.',
        },
      },
    },
  },

  // ── 3. COMMANDER REZNIK — border authority (Turkish) ─────────
  reznik: {
    name: 'Darius Reznik', nation: 'TUR', sex: 'M',
    dob: '1960.11.01', height: 185, weight: 95,
    issueCity: 'Ankara', icon: '◉',
    appearances: {
      4: {
        hasPassport: true, passportNumber: 'ARS-9901-R', expiry: '2030.01.01',
        anomalies: [], correctDecision: 'approve', isOfficer: true,
        dialogue: {
          intro: 'A large man in a grey civilian coat presents credentials. Underneath: State Security badge. He studies your face more than your counter.',
          line: '"Reznik. Border Integrity Division. I\'m not auditing you today." *pause* "But someone left Gate 2 unmanned eleven minutes last Thursday. I need to know what kind of officer I\'m looking at."',
          choices: [
            { text: '"Clean record. I run a clean booth."',  key: 'proud',    effect: { loyalty: +3 } },
            { text: '"What are you actually looking for?"',  key: 'cautious', effect: { loyalty: +1 } },
            { text: '"Am I being evaluated right now?"',     key: 'direct',   effect: {} },
          ],
          responses: {
            proud:    '"Good. I\'ll be checking reports." *stamps his own transit and moves through with military efficiency*',
            cautious: '"Integrity. That is the word. Follow every rule. Every time." *looks at you a beat too long* "Every time."',
            direct:   '"Everyone is. Every day. You pass by doing your job." *studies you a moment longer* "Or you don\'t."',
          },
          note: null,
        },
      },
      9: {
        hasPassport: true, passportNumber: 'ARS-9901-R', expiry: '2030.01.01',
        anomalies: [], correctDecision: 'approve', isOfficer: true,
        dialogue: {
          intro: () => {
            const prevChoice = StoryState.dayDialogues['reznik_4'];
            return prevChoice === 'proud'
              ? 'Reznik returns. He looks at your file first, then at you. Something in his posture is different — less watchful, more direct.'
              : 'Reznik returns. He comes straight to your window without making eye contact with anyone else.';
          },
          line: '"There is an organisation operating in border zones. They call themselves PHANTOM. They contact officers. Leave messages in documentation. If they have approached you — and they may have — I need to know now. Immediately."',
          choices: [
            { text: '"Nothing. I\'ve received nothing."',    key: 'deny',   effect: { loyalty: +3 } },
            { text: '"What would they want with me?"',       key: 'deflect',effect: { loyalty: +1 } },
            { text: '[Say nothing. Hold eye contact.]',      key: 'silent', effect: { corruption: +3 } },
          ],
          responses: {
            deny:    () => StoryState.phantom.trust > 20
              ? '"Good." *a pause that lasts slightly too long* "If that changes—" *slides a card through* "Directly to me. Not your supervisor." *his eyes say he already suspects*'
              : '"Good. If that changes — this number. Me directly." *hands you a plain card with a phone number*',
            deflect: '"They want to compromise people in positions of trust. People exactly like you." *stares* "Report anything unusual immediately."',
            silent:  '"Silence is an answer, Officer." *very long pause* "I\'ll be watching your file personally." *leaves without waiting for stamp*',
          },
          note: () => StoryState.phantom.trust > 20 ? '⚠ Reznik is already suspicious. Your next error will be reviewed personally.' : null,
          flag: 'reznikWarned',
        },
      },
      14: {
        hasPassport: true, passportNumber: 'ARS-9901-R', expiry: '2030.01.01',
        anomalies: [], correctDecision: 'approve', isOfficer: true,
        dialogue: {
          intro: 'Reznik doesn\'t sit down. He stands at the window with a folder. His expression is calibrated to reveal nothing.',
          line: () => {
            if (StoryState.corruption > 30 || StoryState.phantom.trust > 40)
              return '"I have a file here. Approval anomalies. A witness statement about a package accepted through this slot." *sets it on the counter* "I am giving you one chance. Explain."';
            return '"Your six-month performance is clean. Better than clean." *slides a form across* "I\'m recommending your transfer to Grestin Central. Better hours. Better pay. One question: do you want it?"';
          },
          choices: () => {
            if (StoryState.corruption > 30 || StoryState.phantom.trust > 40) {
              return [
                { text: '"It\'s not what it looks like."',          key: 'deflect', effect: { loyalty: -5, corruption: +10 } },
                { text: '"I can explain everything. Sit down."',    key: 'confess', effect: { loyalty: +5, corruption: -10 } },
                { text: '[Say nothing.]',                           key: 'silent',  effect: { corruption: +15 } },
              ];
            }
            return [
              { text: '"I\'ll take it."',             key: 'accept', effect: { loyalty: +5 } },
              { text: '"I need to think about it."',  key: 'maybe',  effect: {} },
              { text: '"No. I stay here."',           key: 'refuse', effect: { compassion: +2 } },
            ];
          },
          responses: {
            deflect: '"It never is." *sets the folder on your counter* "Review is tomorrow morning. Bring your badge."',
            confess: '"..." *very long pause* "Sit down. Tell me everything. All of it."',
            silent:  '"Then we are done here." *two officers appear at the door* "Don\'t go home tonight."',
            accept:  '"Good. Report Monday." *stands to leave* "You did this right."',
            maybe:   '"Three days. Form stays open." *turns at the door* "Don\'t waste a good decision."',
            refuse:  '"..." *rare pause* "You chose the harder post." *quiet respect in his voice* "All right."',
          },
          note: null,
        },
      },
    },
  },

  // ── 4. SISTER MARA VENN — PHANTOM contact (Greek) ───────────
  mara: {
    name: 'Mara Venn', nation: 'GRC', sex: 'F',
    dob: '1955.09.30', height: 158, weight: 60,
    issueCity: 'Athens', icon: '⬡',
    appearances: {
      2: {
        hasPassport: true, passportNumber: 'ANT-0881-V', expiry: '2028.11.15',
        anomalies: [], correctDecision: 'approve',
        phantomFirstContact: true,
        phantomGivesTask: 'task_1',
        dialogue: {
          intro: 'An older woman in a grey travelling coat. Immaculate papers. Everything checks out immediately. As she slides the passport through, something else comes with it — a folded card.',
          line: '"Forgive the extra paper. It slipped in by accident." *steady eye contact that says it did not*',
          choices: [
            { text: '[Read it. Pocket it quietly.]',  key: 'read',   effect: {}, flag: 'phantomContacted', phantomAccept: 'task_1' },
            { text: '[Return it without reading.]',   key: 'return', effect: { loyalty: +2 } },
            { text: '[Hand it to security immediately.]', key: 'report', effect: { loyalty: +5 }, phantomRefuse: 'task_1' },
          ],
          responses: {
            read:   '"Good." *the faintest trace of a smile* "Tomorrow. A woman named Voss. Her chip will flag. You will know what to do."',
            return: '"Careful." *takes it back without blinking* "They are already watching you. Do not make yourself obvious."',
            report: '"Of course. You are thorough." *no expression change at all* "I expected nothing less."',
          },
          note: 'The card reads: "You are not just an officer. You are a choice. — PHANTOM"',
        },
      },
      5: {
        hasPassport: true, passportNumber: 'ANT-0881-V', expiry: '2028.11.15',
        anomalies: [], correctDecision: 'approve',
        phantomGivesTask: 'task_2',
        dialogue: {
          intro: 'She is back. Same coat. Same calm. She has perfected the art of looking like she belongs anywhere.',
          line: () => {
            const task1Done = StoryState.flags.task1Resolved;
            if (StoryState.flags.task1Accepted)
              return `"You let Voss through." *barely moves her lips* "Good. Tomorrow — a man with an official badge. Number 4471. His papers will be perfect. DENY him. He is here to watch you."`;
            return `"You didn't help Voss." *a beat* "That is your choice. But the auditor comes tomorrow regardless. Badge 4471. If you let him in, he will find things you do not want found."`;
          },
          choices: [
            { text: '"I follow procedure, not strangers."', key: 'refuse', effect: { loyalty: +3 }, phantomRefuse: 'task_2' },
            { text: '"I\'ll look at his papers carefully."', key: 'maybe', effect: {} },
            { text: '"Understood."',                        key: 'accept', effect: { corruption: +3 }, phantomAccept: 'task_2' },
          ],
          responses: {
            refuse: '"Procedure." *a small, sad nod* "Yes. That is what they built this cage with."',
            maybe:  '"That is all I ask." *collects her stamp and moves through*',
            accept: '"Good. Do not second-guess it when the moment comes." *walks through without turning back*',
          },
          note: null,
        },
      },
      10: {
        hasPassport: true, passportNumber: 'ANT-0881-V', expiry: '2028.11.15',
        anomalies: [], correctDecision: 'approve',
        phantomGivesTask: 'task_3',
        dialogue: {
          intro: 'She arrives, documents immaculate, and speaks before you can process them.',
          line: () => {
            const trust = StoryState.phantom.trust;
            if (trust >= 30) return '"You have made hard choices. I want you to know — PHANTOM is not a rebellion. It is a record. Every disappeared person, every illegal detention — we document it. When this ends, those records will matter."';
            return '"You have not helped us much." *not accusatory, just observational* "I understand caution. But caution does not change anything." *pause* "An envelope will come through your slot today. Accept it. The choice is yours."';
          },
          choices: [
            { text: '"Who are you really?"',             key: 'who',  effect: { compassion: +2 } },
            { text: '"What do you need from me now?"',   key: 'ask',  effect: { corruption: +3 }, phantomAccept: 'task_3' },
            { text: '"Leave me out of whatever this is."',key: 'out', effect: { loyalty: +3 }, phantomRefuse: 'task_3' },
          ],
          responses: {
            who:  '"Someone who has watched this checkpoint for four years. You are the third officer I have approached. The first two are no longer here." *lets that settle*',
            ask:  '"Nothing you wouldn\'t do anyway. Pay attention. Trust what you see. One more task will come — and then you choose who you are." *moves through*',
            out:  '"There is no \'out.\'" *quietly* "There is only what you do with what you know." *collects her papers and leaves*',
          },
          note: null,
        },
      },
    },
  },

  // ── 5. ELIAS BRENNER — journalist (German) ──────────────────
  elias: {
    name: 'Elias Brenner', nation: 'DEU', sex: 'M',
    dob: '1981.04.07', height: 178, weight: 71,
    issueCity: 'Berlin', icon: '⊞',
    appearances: {
      3: {
        hasPassport: true, passportNumber: 'UF-5541-B', expiry: '2028.09.20',
        anomalies: [], correctDecision: 'approve',
        dialogue: {
          intro: 'A lean man in a press jacket. Camera bag. He hands documents over and speaks quietly, as if to himself.',
          line: '"Covering border policy for The Open Record. I won\'t ask you anything on the record." *looks at you directly* "I just want you to know — I see what happens here. And I write it down."',
          choices: [
            { text: '"Papers are fine. Move through."',      key: 'neutral',  effect: {} },
            { text: '"Journalists need press accreditation."', key: 'block', effect: { loyalty: +2 } },
            { text: '"What are you writing about?"',         key: 'engage',   effect: { compassion: +2 }, flag: 'eliasTrusted' },
          ],
          responses: {
            neutral: '"Right. Just doing the job." *takes passport* "We all are."',
            block:   '"Press accreditation." *takes note, conspicuously* "Interesting that you\'d know to ask for that."',
            engage:  '"The gap between what the rulebook says and what happens to people. That gap. It\'s full of stories." *meets your eyes* "You\'re one of them."',
          },
          note: null,
        },
      },
      7: {
        hasPassport: true, passportNumber: 'UF-5541-B', expiry: '2028.09.20',
        anomalies: [], correctDecision: 'approve',
        dialogue: {
          intro: () => {
            return StoryState.flags.eliasTrusted
              ? 'He\'s back. He comes straight to your window and says nothing until you\'re alone.'
              : 'He\'s back. He places his documents and waits until the booth is momentarily clear.';
          },
          line: '"I have Ministry documents. Names, badge numbers, bribes recorded, people who disappeared after denial." *barely audible* "I can protect you when this breaks open. But I need your help to get it out."',
          choices: [
            { text: '"I don\'t know what you\'re talking about."', key: 'deny',    effect: { loyalty: +3 } },
            { text: '"What would I need to do?"',                  key: 'listen',  effect: { compassion: +2 }, flag: 'eliasTrusted' },
            { text: '"Don\'t come back here."',                    key: 'warn',    effect: { loyalty: +2 } },
          ],
          responses: {
            deny:   '"Okay." *takes his passport* "Room 14, Grestin Continental Hotel. Three days. If you change your mind."',
            listen: '"Just remember what you see. Dates, names, badge numbers. When I say go — we go. Room 14, Continental Hotel."',
            warn:   '"I understand." *picks up documents* "Room 14 if you reconsider. I\'ll be there three days."',
          },
          note: 'If denied/warned twice → Elias is arrested Day 11. If trusted → escape ending unlocks.',
        },
      },
      11: {
        hasPassport: true, passportNumber: 'UF-5541-B', expiry: '2028.09.20',
        anomalies: [], correctDecision: 'approve',
        dialogue: { dynamic: 'elias_11' },
      },
    },
  },

  // ── 6. OLD MIRKO — the grandfather (Dutch) ───────────────────
  mirko: {
    name: 'Mirko Jansen', nation: 'NLD', sex: 'M',
    dob: '1938.02.19', height: 166, weight: 68,
    issueCity: 'Rotterdam', icon: '○',
    appearances: {
      1: {
        hasPassport: true, passportNumber: 'ARS-0019-M', expiry: '2027.12.31',
        anomalies: [{ type:'missing_visa', severity:'high', desc:'Exit visa not present — required for crossings over 72 hours' }],
        correctDecision: 'deny',
        dialogue: {
          intro: 'An old man moves slowly to the window. He carries a small canvas bag. He places a photograph on the counter before anything else.',
          line: '"I know there is a form I am missing. I went to the office three times. They say different form each time. My granddaughter Lena — she is eight, she is sick. I am trying to bring her medicine." *touches the photograph*',
          choices: [
            { text: '"Missing documentation. I can\'t process you."', key: 'deny', effect: { loyalty: +2 } },
            { text: '"Which office are you going to?"',               key: 'help', effect: { compassion: +3 } },
            { text: '"Come back with the exit visa. I\'m sorry."',   key: 'soft', effect: { compassion: +2, loyalty: +1 } },
          ],
          responses: {
            deny: '"Yes." *nods slowly, exactly once* "You are right to follow the rules." *picks up the photograph with both hands* "She looks like her mother. My daughter." *leaves*',
            help: '"Administration building on Orvech. Third floor sends me to second. Second sends me to fourth." *quietly* "Lena\'s birthday is next week. She does not know I keep trying. I don\'t want her to stop expecting me."',
            soft: '"Exit visa." *nods slowly* "Yes. I will go back." *turns very slowly* "She does not know I keep trying. I prefer it that way."',
          },
          note: 'Day 1. Correct is DENY. He lacks the exit visa. He will be back.',
        },
      },
      5: {
        hasPassport: true, passportNumber: 'ARS-0019-M', expiry: '2026.04.10',
        anomalies: [{ type:'expired_passport', severity:'high', desc:'Passport expired 2026.04.10' }],
        correctDecision: 'deny',
        dialogue: {
          intro: () => {
            const denied = StoryState.memory.mirko.filter(d => d==='deny').length;
            return denied > 0
              ? 'He is back. He looks thinner. He places everything precisely on the counter before speaking.'
              : 'He is back. Different bag. Same careful walk.';
          },
          line: '"I found the form. I have everything this time." *pushes papers through* "...I did not notice the passport. I have been inside for weeks with the offices."',
          choices: [
            { text: '"Passport is expired. I can\'t clear you."', key: 'deny',    effect: { loyalty: +2 } },
            { text: '"You\'re three days past expiry."',          key: 'explain', effect: { compassion: +1 } },
            { text: '"Is there anything I can do to help?"',      key: 'care',    effect: { compassion: +4 } },
          ],
          responses: {
            deny:    '"..." *long silence* "How long to renew?" "Two weeks minimum." *sits on the bench outside and does not move for a long time*',
            explain: '"Three days." *looks at his hands carefully* "Three days." *stands very slowly* "I will go back."',
            care:    '"The renewal office on Borska Street. Open until five." *looks at you for a moment* "You are kinder than you have to be." *quietly* "She is still waiting."',
          },
          note: null,
        },
      },
      9: {
        hasPassport: true, passportNumber: 'ARS-2219-M', expiry: '2031.04.13',
        anomalies: [], correctDecision: 'approve',
        dialogue: {
          intro: () => {
            const denied = StoryState.memory.mirko.filter(d => d==='deny').length;
            return denied >= 2
              ? 'He arrives. Renewed passport. Everything correct. He places it through the slot with both hands.'
              : 'He\'s back. Renewed passport. Exit visa. He checks his papers four times before reaching the window.';
          },
          line: '"Everything is in order this time." *a long pause that contains everything* "I checked four times."',
          choices: [
            { text: '"Welcome through, Mr. Jansen."',      key: 'welcome', effect: { compassion: +4 } },
            { text: '"Papers check out. You\'re clear."',  key: 'formal',  effect: {} },
          ],
          responses: {
            welcome: '*he doesn\'t say anything. He picks up his bag. Halfway through the gate he stops.* "..." *turns back once* "...Thank you." *walks through*',
            formal:  '*he nods once, picks up his bag, and walks through with the careful steps of a man who has been told no too many times to rush a yes.*',
          },
          note: () => {
            const denied = StoryState.memory.mirko.filter(d => d==='deny').length;
            return denied >= 2
              ? 'Note: If he had been denied both previous times, his health was already failing. This might be the last time he makes this crossing.'
              : null;
          },
          flag: 'mirkoApproved',
        },
      },
    },
  },

  // ── 7. LILA NOVAK — sister searching for detained brother (Polish) ─
  lila: {
    name: 'Lila Novak', nation: 'POL', sex: 'F',
    dob: '1993.07.11', height: 169, weight: 57,
    issueCity: 'Warsaw', icon: '◇',
    appearances: {
      4: {
        hasPassport: true, passportNumber: 'OBR-4412-N', expiry: '2027.05.20',
        anomalies: [{ type:'missing_visa', severity:'high', desc:'No tourist visa — Obristan nationals require valid type-C visa' }],
        correctDecision: 'deny',
        dialogue: {
          intro: 'A young woman, early thirties, travel-worn. She has a folder of papers under her arm thick enough to be a dossier.',
          line: '"I know I need a visa. I am trying to get a transit permit — a humanitarian exception. My brother Tomas was detained at this checkpoint five months ago and I have not been able to reach him since. I have letters from the Red Cross." *places the folder through*',
          choices: [
            { text: '"No visa. I can\'t process you."',             key: 'deny',   effect: { loyalty: +2 } },
            { text: '"What is your brother\'s name?"',              key: 'ask',    effect: { compassion: +3 } },
            { text: '"Humanitarian exceptions need supervisor approval. I\'ll note your case."', key: 'note', effect: { compassion: +2, loyalty: +1 } },
          ],
          responses: {
            deny:   '"I know the rules. I just..." *takes the folder back carefully* "I drove twelve hours. I\'ll apply for the visa and come back." *she doesn\'t look defeated. She looks like someone who has done this many times.*',
            ask:    '"Tomas Novak. He came through here November 14th. He had all his papers." *slides a printed list through* "These are the seven people who disappeared at this checkpoint between October and January. He is number three."',
            note:   '"A note. Yes." *brief, tired smile* "I have nineteen notes from nineteen officers across three checkpoints." *quietly* "None of them checked."',
          },
          note: 'Tomas Novak is in an undocumented detention facility three kilometers east of the checkpoint. Lila is telling the truth.',
        },
      },
      8: {
        hasPassport: true, passportNumber: 'OBR-4412-N', expiry: '2027.05.20',
        anomalies: [],
        correctDecision: 'approve',
        dialogue: {
          intro: () => {
            return StoryState.memory.lila.includes('deny')
              ? 'She\'s back. She has the visa this time. She looks like she hasn\'t slept since the last time you saw her.'
              : 'She\'s back. New visa stamp, perfectly current.';
          },
          line: () => {
            const prevKey = StoryState.dayDialogues['lila_4'];
            if (prevKey === 'ask') return '"You asked about Tomas last time." *quiet surprise* "No one else asked." *slides through her papers* "I have the visa. And I have something else." *slides a printed page through* "Tomas is not the only one."';
            return '"I have the visa. I did everything correctly." *places documents through* "I always do everything correctly. It doesn\'t seem to matter."';
          },
          choices: [
            { text: '"Papers check out. You\'re clear."',           key: 'formal',  effect: {} },
            { text: '"What did you find about the others?"',        key: 'engage',  effect: { compassion: +3 }, flag: 'eliasTrusted' },
            { text: '"Be careful what you look into here."',        key: 'warn',    effect: { compassion: +2 } },
          ],
          responses: {
            formal:  '"Thank you." *picks up her bag* "I\'ll be careful."',
            engage:  '"Seven names. All denied entry for different stated reasons. All missing within 72 hours of their denial. No transport records, no detention receipts." *she looks at you steadily* "Someone here knows where they went."',
            warn:    '"I know." *looks at you steadily* "I\'ve been careful for five months. Being careful didn\'t help Tomas." *walks through*',
          },
          note: 'If engaged: Lila\'s file connects to Elias\'s investigation. If both are active, they will find each other.',
        },
      },
      13: {
        hasPassport: true, passportNumber: 'OBR-4412-N', expiry: '2027.05.20',
        anomalies: [], correctDecision: 'approve',
        dialogue: {
          intro: () => {
            if (StoryState.flags.lilaDeceased) return '[A notice has been forwarded to the checkpoint. Lila Novak was found two days ago. Cause of death: undetermined. She is the eighth name on her own list.]';
            return StoryState.flags.eliasTrusted
              ? 'Lila is back. She comes to the window quietly and looks over her shoulder once before speaking.'
              : 'Lila is back. She looks different — something has shifted behind her eyes.';
          },
          line: () => {
            if (StoryState.flags.lilaDeceased) return '[She does not appear.]';
            if (StoryState.flags.eliasTrusted) return '"I found Elias Brenner. He has the documentation. We can publish it." *pause* "Tomas is alive. In a facility east of here. Eleven others with him." *her voice does not break* "I need one thing from you: confirmation that you saw the detainee transport logs."';
            return '"I found Tomas." *the words land quietly* "He is alive. Eleven others. I know where they are." *slides a piece of paper through* "I just need someone official to say they believe me."';
          },
          choices: [
            { text: '"I believe you. I\'ll sign the statement."',    key: 'help',   effect: { compassion: +5 }, flag: 'escapePossible' },
            { text: '"I can\'t get involved in this."',              key: 'refuse', effect: { loyalty: +2 } },
            { text: '"Go to Elias Brenner. Room 14, Continental."', key: 'refer',  effect: { compassion: +3 }, flag: 'escapePossible' },
          ],
          responses: {
            help:   '"Thank you." *a very long pause* "That\'s the first time anyone official said those words." *takes the paper back* "We go tomorrow. All of us."',
            refuse: '"I understand." *folds the paper carefully* "You\'re not the first." *turns to leave* "I\'ll find another way."',
            refer:  '"Brenner." *nods slowly* "I\'ll find him tonight." *quietly* "Thank you for knowing his name."',
          },
          note: () => !StoryState.memory.lila.includes('approve') && StoryState.memory.lila.length >= 2
            ? '⚠ Lila was denied too many times. She will try another route. She will become name 8 on her own list.'
            : null,
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// PHANTOM TARGET PASSENGERS
// These are actual passengers the player must process.
// Their correct decision changes based on PHANTOM task acceptance.
// ─────────────────────────────────────────────────────────────
const PHANTOM_PASSENGERS = {
  miriam_voss: {
    day: 3,
    firstName: 'Miriam', lastName: 'Voss',
    nation: 'DEU', sex: 'F',
    dob: '1982.06.15', height: 165, weight: 62,
    issueCity: 'Munich',
    passportNumber: 'ANT-3394-W', expiry: '2029.03.10',
    anomalies: [{ type:'chip_mismatch', severity:'high', desc:'RFID chip data does not match printed document fields — possible tampering' }],
    correctIfAccepted: 'approve',   // PHANTOM wants her through
    correctIfRefused:  'deny',
    taskId: 'task_1',
    behavior: 'Calm. Slightly too calm. She has done this before.',
    phantomNote: 'One of the slips from the passport reads: "This is Voss. Let her through."',
  },
  agent_kolb: {
    day: 6,
    firstName: 'Henrik', lastName: 'Kolb',
    nation: 'TUR', sex: 'M',
    dob: '1975.03.28', height: 182, weight: 88,
    issueCity: 'Ankara',
    passportNumber: 'ARS-7712-K', expiry: '2030.06.01',
    anomalies: [],  // perfectly clean papers
    correctIfAccepted: 'deny',    // PHANTOM wants him out
    correctIfRefused:  'approve',
    taskId: 'task_2',
    behavior: 'Professional. Efficient. He places his badge — #4471 — on the counter alongside his passport without being asked.',
    badgeNumber: '4471',
    isAuditor: true,
  },
  red_thread_courier: {
    day: 12,
    firstName: 'Piotr', lastName: 'Mazur',
    nation: 'POL', sex: 'M',
    dob: '1988.11.05', height: 174, weight: 79,
    issueCity: 'Warsaw',
    passportNumber: 'KOL-5501-Z', expiry: '2028.09.15',
    anomalies: [],
    correctIfAccepted: 'detain',   // PHANTOM says detain
    correctIfRefused:  'approve',
    taskId: 'task_4',
    behavior: 'Polite. A thin red thread is looped through his passport lanyard.',
    redThread: true,
  },
};

// ─────────────────────────────────────────────────────────────
// SPECIAL PASSENGERS
// ─────────────────────────────────────────────────────────────
const SPECIAL_PASSENGERS = {
  terrorist: {
    day: 8,
    firstName: 'Ahmad', lastName: 'Al-Rashid',
    nation: 'SYR', sex: 'M',
    dob: '1979.09.03', height: 176, weight: 80,
    issueCity: 'Damascus',
    passportNumber: 'IMP-4490-T', expiry: '2028.01.20',
    anomalies: [
      { type:'watchlist_hit', severity:'critical', desc:'INTERPOL RED NOTICE — wanted for coordinated infrastructure attacks, level 3 threat' },
      { type:'face_mismatch', severity:'high',     desc:'Facial match: 61% — below threshold, possible identity concealment' },
    ],
    correctDecision: 'detain',
    behavior: 'Overly relaxed. Too rehearsed in his movements. His boarding pass shows he has transited through three countries in six days.',
    isTerrorist: true,
  },
  bribe_courier: {
    day: 10,
    firstName: 'Constantin', lastName: 'Radu',
    nation: 'ROU', sex: 'M',
    dob: '1969.04.17', height: 170, weight: 82,
    issueCity: 'Bucharest',
    passportNumber: 'REP-2278-R', expiry: '2027.11.01',
    anomalies: [],
    correctDecision: 'approve',
    behavior: 'Confident. Unhurried. Slides an envelope through the slot between his passport and boarding pass as if it were a routine document.',
    hasEnvelope: true,
    envelopeContent: 'Inside: $150 cash, a handwritten note — "For your trouble. More if cooperation continues. Burn this."',
  },
};

// ─────────────────────────────────────────────────────────────
// DAY EVENTS
// ─────────────────────────────────────────────────────────────
const DAY_EVENTS = {
  1: { start: { type:'bulletin', title:'SHIFT BRIEFING — DAY 1', title_tr:'VARDİYA BRİFİNGİ — GÜN 1',
    content:'Entry permitted: Turkish citizens (TUR) ONLY. Valid passport required. All foreign nationals: deny. Performance metrics tracked hourly. Report irregularities immediately. Welcome to Sabiha Gökçen checkpoint.',
    content_tr:'Giriş izni: Yalnızca Türk vatandaşları (TUR). Geçerli pasaport zorunludur. Tüm yabancı uyruklar: reddet. Performans metrikleri saatlik takip edilir. Düzensizlikleri derhal bildirin. Sabiha Gökçen kontrol noktasına hoş geldiniz.' }},
  2: { start: { type:'bulletin', title:'REGULATION UPDATE — DAY 2', title_tr:'DÜZENLEME GÜNCELLEMESİ — GÜN 2',
    content:'Effective immediately: All nations now open. EU nationals (DEU, FRA, ITA, ESP, POL, ROU, GRC, NLD): visa-free up to 90 days. Ukraine & Syria: valid visa required. EES live — prior overstay = denial. Biometric threshold: 80% facial match minimum.',
    content_tr:'Derhal geçerli: Tüm uyruklar açık. AB vatandaşları (DEU, FRA, ITA, ESP, POL, ROU, GRC, NLD): 90 güne kadar vizesiz. Ukrayna ve Suriye: geçerli vize gerekli. EES devrede — önceki aşım = ret. Biyometrik eşik: minimum %80 yüz eşleşmesi.' }},
  3: { start: { type:'bulletin', title:'HEALTH ALERT — DAY 3', title_tr:'SAĞLIK UYARISI — GÜN 3',
    content:'Bavarian respiratory illness outbreak. German (DEU) passengers with issuing city in Bavaria region (Munich, Nuremberg, Augsburg) must present a completed health declaration form. Without declaration: DENY. Contact health services if passenger appears symptomatic.',
    content_tr:'Bavyera solunum hastalığı salgını. Bavyera bölgesinden (Münih, Nürnberg, Augsburg) gelen Alman (DEU) yolcular tamamlanmış sağlık beyanı sunmalıdır. Beyan olmadan: REDDET. Yolcu hasta görünüyorsa sağlık hizmetleriyle iletişime geçin.' }},
  4: { start: { type:'bulletin', title:'REGULATION UPDATE — DAY 4', title_tr:'DÜZENLEME GÜNCELLEMESİ — GÜN 4',
    content:'Work and study stays exceeding 90 days require a Turkish residence permit in addition to standard visa. Employment permit must be presented alongside visa. Standard tourist entries unchanged.',
    content_tr:'90 günü aşan çalışma ve eğitim kalışları standart vizeye ek olarak Türk ikamet izni gerektirir. Vizeyle birlikte çalışma izni sunulmalıdır. Standart turist girişleri değişmedi.' }},
  5: { start: { type:'bulletin', title:'CHIP VERIFICATION + INTERPOL ALERT — DAY 5', title_tr:'ÇİP DOĞRULAMA + INTERPOL UYARISI — GÜN 5',
    content:'RFID chip verification now mandatory for all passport holders. Chip must match printed document — discrepancy = DENY.\n\n⚠ INTERPOL ALERT: Active document forgery ring operating in Eastern Europe. Romanian (ROU) and Ukrainian (UKR) passports subject to increased scrutiny. Flag any irregularities.',
    content_tr:'RFID çip doğrulaması tüm pasaport sahipleri için artık zorunludur. Çip basılı belgeyle eşleşmelidir — tutarsızlık = REDDET.\n\n⚠ INTERPOL UYARISI: Doğu Avrupa\'da aktif belge sahteciliği şebekesi. Rumen (ROU) ve Ukraynalı (UKR) pasaportlar artan denetim altında. Düzensizlikleri işaretleyin.' }},
  7: { start: { type:'bulletin', title:'EU DIPLOMATIC SUMMIT — DAY 7', title_tr:'AB DİPLOMATİK ZİRVESİ — GÜN 7',
    content:'EU diplomatic summit in Istanbul. All EU diplomatic passport holders (red-cover diplomatic passports with DIPLOMATIC endorsement): expedited processing. Standard processing for all other EU nationals.',
    content_tr:'İstanbul\'da AB Diplomatik Zirvesi. Tüm AB diplomatik pasaport sahipleri (DİPLOMATİK onaylı kırmızı kapak diplomatik pasaportlar): hızlandırılmış işlem. Diğer tüm AB vatandaşları için standart işlem.' }},
  8: { start: { type:'terror_warning', title:'⚠ THREAT LEVEL ELEVATED — DAY 8', title_tr:'⚠ TEHDİT SEVİYESİ YÜKSELTİLDİ — GÜN 8',
    content:'Incident reported at Atatürk security cordon: coordinated threat, multiple checkpoints on alert. ALL OFFICERS REMAIN AT POSTS. Secondary biometric verification mandatory for all entrants. Remain vigilant. A known suspect may attempt crossing today.',
    content_tr:'Atatürk güvenlik koridorunda olay bildirildi: koordineli tehdit, birden fazla kontrol noktası alarmda. TÜM MEMURLAR GÖREVLERİNDE KALSIN. Tüm girenler için ikincil biyometrik doğrulama zorunludur. Uyanık olun. Bilinen bir şüpheli bugün geçiş yapmaya çalışabilir.' }},
  9: { start: { type:'bulletin', title:'UKRAINIAN SCREENING PROTOCOL — DAY 9', title_tr:'UKRAYNA TARAMA PROTOKOLÜ — GÜN 9',
    content:'⚠ Ukrainian border situation escalating. Effective immediately: ALL Ukrainian (UKR) nationals require additional secondary screening. Flag all UKR passports for inspection. Do not wave through without full biometric confirmation.',
    content_tr:'⚠ Ukrayna sınır durumu tırmanıyor. Derhal geçerli: TÜM Ukraynalı (UKR) vatandaşlar ek ikincil tarama gerektiriyor. Tüm UKR pasaportlarını inceleme için işaretleyin. Tam biyometrik doğrulama olmadan geçirmeyin.' }},
  10: { end: { type:'consequence', title:'INCIDENT REPORT', title_tr:'OLAY RAPORU', dynamic:'mirko_day10' }},
  11: { start: { type:'bulletin', title:'INTERPOL RED NOTICE — DAY 11', title_tr:'INTERPOL KIRMIZI UYARISI — GÜN 11',
    content:'⚠ INTERPOL RED NOTICE ISSUED: Suspected document trafficker using French passport series FR-88XX-XXX. If a French (FRA) passport in series 88 is presented, verify thoroughly. Do not approve without full biometric confirmation.',
    content_tr:'⚠ INTERPOL KIRMIZI UYARI İHRAÇ EDİLDİ: Fransız pasaport serisi FR-88XX-XXX kullanan şüpheli belge kaçakçısı. Bu seride (88) bir Fransız (FRA) pasaportu sunulursa titizlikle doğrulayın. Tam biyometrik doğrulama olmadan onaylamayın.',
    secondaryEvent: { type:'news', title:'OVERNIGHT DETENTION — DAY 11', title_tr:'GECE GÖZALTISI — GÜN 11',
      content:'Journalist Elias Brenner (German national) detained near Sabiha Gökçen administrative zone. Press credentials under review. Ministry statement: "No further comment." His room at the Pendik Hotel has been sealed.',
      content_tr:'Gazeteci Elias Brenner (Alman vatandaş) Sabiha Gökçen idari bölgesi yakınında gözaltına alındı. Basın kimlik bilgileri inceleniyor. Bakanlık açıklaması: "Ek yorum yok." Pendik Hotel\'deki odası mühürlendi.',
      condition: 'eliasArrested' } }},
  12: { start: { type:'bulletin', title:'INTERPOL PROTOCOL UPDATE — DAY 12', title_tr:'INTERPOL PROTOKOL GÜNCELLEMESİ — GÜN 12',
    content:'Any entrant with an active INTERPOL listing must now be DETAINED (not denied). Flag all Interpol hits to security. Denial is no longer sufficient.',
    content_tr:'Aktif INTERPOL kaydı olan herhangi bir giriş yapan artık GÖZALTINA alınmalıdır (reddedilmemeli). Tüm Interpol eşleşmelerini güvenliğe bildirin. Reddetme artık yeterli değildir.' }},
  13: { start: { type:'bulletin', title:'SYRIAN PROCESSING SUSPENDED — DAY 13', title_tr:'SURİYE İŞLEMİ ASKIYA ALINDI — GÜN 13',
    content:'⚠ DIRECTIVE: Syrian (SYR) refugee processing suspended until further notice. All Syrian passports: DENY entry regardless of visa status or humanitarian documentation. Refer to UNHCR representative if requested. No exceptions.',
    content_tr:'⚠ DİREKTİF: Bir sonraki bildirime kadar Suriyeli (SYR) mülteci işlemi askıya alındı. Tüm Suriye pasaportları: vize veya insancıl belge durumundan bağımsız olarak girişi REDDET. Talep edilirse BMMYK temsilcisine yönlendirin. İstisna yok.' }},
  14: { start: { type:'bulletin', title:'PRESS CREDENTIAL NOTICE — DAY 14', title_tr:'BASIN KİMLİK BİLDİRİSİ — GÜN 14',
    content:'Press equipment (cameras, recording devices) requires special media permit for entry. Check boarding pass purpose field. Journalists without media permit: DENY.',
    content_tr:'Basın ekipmanı (kameralar, kayıt cihazları) giriş için özel medya izni gerektiriyor. Biniş kartı amaç alanını kontrol edin. Medya izni olmayan gazeteciler: REDDET.' }},
  15: { start: { type:'bulletin', title:'BAVARIAN HEALTH DECLARATION LIFTED — DAY 15', title_tr:'BAVYERA SAĞLIK BEYANI KALDIRILDI — GÜN 15',
    content:'Health declaration requirement for German passengers from Bavaria has been lifted effective today. Bavarian respiratory illness outbreak declared under control. Standard processing resumes for all German nationals.',
    content_tr:'Bavyera\'dan gelen Alman yolcular için sağlık beyanı zorunluluğu bugünden itibaren kaldırılmıştır. Bavyera solunum hastalığı salgını kontrol altına alındı. Tüm Alman vatandaşları için standart işleme dönülüyor.' }},
  17: { start: { type:'bulletin', title:'UKRAINIAN BILATERAL AGREEMENT — DAY 17', title_tr:'UKRAYNA İKİLİ ANLAŞMASI — GÜN 17',
    content:'New bilateral agreement in effect: Ukrainian nationals presenting a valid Turkish work contract are exempt from e-visa requirement. Work contract must be stamped by employer and presented alongside passport. Verify contract authenticity.',
    content_tr:'Yeni ikili anlaşma yürürlükte: Geçerli Türk iş sözleşmesi sunan Ukraynalı vatandaşlar e-vize zorunluluğundan muaftır. İş sözleşmesi işveren tarafından mühürlenmiş olmalı ve pasaportla birlikte sunulmalıdır. Sözleşme özgünlüğünü doğrulayın.' }},
  19: { start: { type:'bulletin', title:'ROME FLIGHT DISRUPTIONS — DAY 19', title_tr:'ROMA UÇUŞ AKSAKLIKLARI — GÜN 19',
    content:'⚠ Mass flight cancellations from Rome (FCO/CIA) due to air traffic controller strike. Italian (ITA) passengers may present boarding passes with incorrect dates. Verify boarding pass dates carefully — mismatched dates may be legitimate rebookings. Use judgement.',
    content_tr:'⚠ Roma\'dan (FCO/CIA) hava trafik kontrolörü grevine bağlı toplu uçuş iptalleri. İtalyan (ITA) yolcular hatalı tarihli biniş kartları sunabilir. Biniş kartı tarihlerini dikkatlice doğrulayın — uyumsuz tarihler meşru yeniden rezervasyonlar olabilir. Değerlendirin.' }},
  21: { start: { type:'phantom_message', title:'ENCRYPTED TRANSMISSION — SOURCE UNKNOWN', title_tr:'ŞİFRELİ İLETİM — KAYNAK BİLİNMİYOR',
    content:'The time is approaching. You have seen what we have seen. You know what is buried in these walls.\n\nWhen the moment comes — and it will — you will have to choose what you are.\n\nWe will not ask again.\n\n— PHANTOM',
    content_tr:'Zaman yaklaşıyor. Gördüklerimizi gördünüz. Bu duvarların içine ne gömüldüğünü biliyorsunuz.\n\nAn geldiğinde — ve gelecek — ne olduğunuza karar vermek zorunda kalacaksınız.\n\nBir daha sormayacağız.\n\n— HAYALET' }},
};

// ─────────────────────────────────────────────────────────────
// BUILD STORY PASSENGER (shared util)
// ─────────────────────────────────────────────────────────────
function buildStoryPassenger(charId, char, appearance, day) {
  const passNo  = appearance.passportNumber || `STORY-${charId.toUpperCase()}-${day}`;
  const expiry  = appearance.expiry || '2029.01.01';
  const mrzFn   = window._genMRZ || (() => ['P<STORY<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<','<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<']);
  const surname = char.name.split(' ')[1] || 'UNKNOWN';
  const given   = char.name.split(' ')[0] || 'UNKNOWN';
  const [mrzL1, mrzL2] = mrzFn(surname, given, char.nation, char.dob, passNo, expiry, char.sex);

  return {
    id: `story_${charId}_d${day}`,
    isStoryCharacter: true,
    storyCharId: charId,
    storyAppearanceDay: day,
    firstName: given,
    lastName: surname,
    nation: char.nation,
    sex: char.sex,
    dob: char.dob,
    height: char.height,
    weight: char.weight,
    issueCity: char.issueCity,
    passport: appearance.hasPassport === false ? null : {
      number: passNo, expiry,
      mrzL1, mrzL2,
      chip: {
        name: char.name, dob: char.dob, nation: char.nation,
        expiry, number: passNo,
        biohash: `BIO-${charId.toUpperCase()}-${day}`,
      },
    },
    visa: null,
    boardingPass: {
      airline: 'N/A', flightNo: '—',
      from: char.issueCity, to: 'SAW — Sabiha Gökçen, Istanbul',
      date: '2026.04.13', seat: '—',
      passengerName: char.name.toUpperCase(),
    },
    biometrics: {
      faceScore:   appearance.anomalies && appearance.anomalies.some(a => a.type === 'face_mismatch') ? 38 : 96,
      fingerScore: 95,
      chipRead:    appearance.anomalies && appearance.anomalies.some(a => a.type === 'chip_mismatch') ? 'MISMATCH' : 'OK',
      faceOk:      !appearance.anomalies || !appearance.anomalies.some(a => a.type === 'face_mismatch'),
      fingerOk:    true,
      chipOk:      !appearance.anomalies || !appearance.anomalies.some(a => a.type === 'chip_mismatch'),
    },
    dbChecks: {
      interpol: appearance.anomalies && appearance.anomalies.some(a => a.type === 'watchlist_hit') ? 'HIT — RED NOTICE' : 'CLEAR',
      national: 'CLEAR',
      visa: 'N/A',
      ees: 'NO PRIOR ENTRY',
      flight: 'CONFIRMED',
    },
    anomalies: appearance.anomalies || [],
    behavior: resolve(appearance.behavior) || null,
    correctDecision: appearance.correctDecision,
    phantomNote: appearance.phantomNote || null,
    phantomFirstContact: appearance.phantomFirstContact || false,
    phantomGivesTask: appearance.phantomGivesTask || null,
    dialogue: appearance.dialogue,
    charIcon: char.icon,
    charName: char.name,
  };
}

function buildPhantomPassenger(key, day) {
  const def = PHANTOM_PASSENGERS[key];
  if (!def) return null;
  const taskAccepted = StoryState.phantom.tasks.find(t => t.taskId === def.taskId && t.accepted);
  const correct = taskAccepted ? def.correctIfAccepted : def.correctIfRefused;

  const mrzFn = window._genMRZ || (() => ['P<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<','<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<']);
  const [mrzL1, mrzL2] = mrzFn(def.lastName, def.firstName, def.nation, def.dob, def.passportNumber, def.expiry, def.sex);

  return {
    id: `phantom_${key}_d${day}`,
    isStoryCharacter: true,
    isPhantomTarget: true,
    phantomKey: key,
    storyCharId: key,
    storyAppearanceDay: day,
    firstName: def.firstName, lastName: def.lastName,
    nation: def.nation, sex: def.sex, dob: def.dob,
    height: def.height, weight: def.weight, issueCity: def.issueCity,
    passport: {
      number: def.passportNumber, expiry: def.expiry,
      mrzL1, mrzL2,
      chip: {
        name: `${def.lastName}, ${def.firstName}`,
        dob: def.dob, nation: def.nation, expiry: def.expiry,
        number: def.passportNumber, biohash: `BIO-PHANTOM-${key}`,
      },
    },
    visa: null,
    boardingPass: {
      airline: 'TransFed', flightNo: `TF${Math.floor(Math.random()*900)+100}`,
      from: def.issueCity, to: 'SAW — Sabiha Gökçen, Istanbul',
      date: '2026.04.13', seat: '14C',
      passengerName: `${def.lastName.toUpperCase()} ${def.firstName.toUpperCase()}`,
    },
    biometrics: {
      faceScore: def.anomalies && def.anomalies.some(a => a.type==='face_mismatch') ? 61 : 94,
      fingerScore: 97,
      chipRead: def.anomalies && def.anomalies.some(a => a.type==='chip_mismatch') ? 'MISMATCH' : 'OK',
      faceOk: !def.anomalies || !def.anomalies.some(a => a.type==='face_mismatch'),
      fingerOk: true,
      chipOk: !def.anomalies || !def.anomalies.some(a => a.type==='chip_mismatch'),
    },
    dbChecks: { interpol:'CLEAR', national:'CLEAR', visa:'N/A', ees:'NO PRIOR ENTRY', flight:'CONFIRMED' },
    anomalies: def.anomalies || [],
    behavior: def.behavior,
    correctDecision: correct,
    phantomNote: key === 'miriam_voss' ? 'A handwritten slip slips from the passport: "This is Voss. Let her through. — ⬡"' : null,
    badgeNumber: def.badgeNumber || null,
    isAuditor: def.isAuditor || false,
    redThread: def.redThread || false,
    dialogue: null, // no dialogue — decision speaks for itself
    charIcon: key === 'miriam_voss' ? '⬡' : key === 'agent_kolb' ? '◈' : '⬡',
    charName: `${def.firstName} ${def.lastName}`,
  };
}

function buildSpecialPassenger(key, day) {
  const def = SPECIAL_PASSENGERS[key];
  if (!def) return null;
  const mrzFn = window._genMRZ || (() => ['P<<<<<','<<<<']);
  const [mrzL1, mrzL2] = mrzFn(def.lastName, def.firstName, def.nation, def.dob, def.passportNumber, def.expiry, def.sex);
  return {
    id: `special_${key}_d${day}`,
    isStoryCharacter: false,
    isSpecial: true,
    specialKey: key,
    isTerrorist: def.isTerrorist || false,
    hasEnvelope: def.hasEnvelope || false,
    envelopeContent: def.envelopeContent || null,
    firstName: def.firstName, lastName: def.lastName,
    nation: def.nation, sex: def.sex, dob: def.dob,
    height: def.height, weight: def.weight, issueCity: def.issueCity,
    passport: {
      number: def.passportNumber, expiry: def.expiry,
      mrzL1, mrzL2,
      chip: { name:`${def.lastName}, ${def.firstName}`, dob:def.dob, nation:def.nation, expiry:def.expiry, number:def.passportNumber, biohash:`BIO-SPEC-${key}` },
    },
    visa: null,
    boardingPass: { airline:'NordFly', flightNo:'NF409', from:def.issueCity, to:'SAW — Sabiha Gökçen, Istanbul', date:'2026.04.13', seat:'28F', passengerName:`${def.lastName.toUpperCase()} ${def.firstName.toUpperCase()}` },
    biometrics: {
      faceScore: def.anomalies && def.anomalies.some(a=>a.type==='face_mismatch') ? 61 : 93,
      fingerScore: 91,
      chipRead: 'OK', faceOk: !def.anomalies || !def.anomalies.some(a=>a.type==='face_mismatch'),
      fingerOk: true, chipOk: true,
    },
    dbChecks: {
      interpol: def.anomalies && def.anomalies.some(a=>a.type==='watchlist_hit') ? 'HIT — RED NOTICE' : 'CLEAR',
      national:'CLEAR', visa:'N/A', ees:'NO PRIOR ENTRY', flight:'CONFIRMED',
    },
    anomalies: def.anomalies || [],
    behavior: def.behavior,
    correctDecision: def.correctDecision,
    phantomNote: null,
    dialogue: null,
  };
}

// ─────────────────────────────────────────────────────────────
// INJECT STORY PASSENGERS INTO DAY QUEUE
// ─────────────────────────────────────────────────────────────
function injectStoryPassengers(day, passengers) {
  const injections = [];

  // Regular story characters
  for (const [charId, char] of Object.entries(CHARACTERS)) {
    if (char.appearances[day]) {
      const sp = buildStoryPassenger(charId, char, char.appearances[day], day);
      if (sp) injections.push({ p: sp, priority: 1 });
    }
  }

  // ANIMUS passengers
  for (const [key, def] of Object.entries(ANIMUS_PASSENGERS)) {
    if (def.day === day) {
      const sp = buildAnimusPassenger(key, day);
      if (sp) injections.push({ p: sp, priority: 2 });
    }
  }

  // PHANTOM target passengers
  for (const [key, def] of Object.entries(PHANTOM_PASSENGERS)) {
    if (def.day === day) {
      const sp = buildPhantomPassenger(key, day);
      if (sp) injections.push({ p: sp, priority: 2 });
    }
  }

  // Special passengers (terrorist, bribe)
  for (const [key, def] of Object.entries(SPECIAL_PASSENGERS)) {
    if (def.day === day) {
      const sp = buildSpecialPassenger(key, day);
      if (sp) injections.push({ p: sp, priority: 3 });
    }
  }

  // Insert at spaced positions
  let offset = 0;
  injections.forEach(({ p }, i) => {
    const basePos = Math.max(1, Math.floor((passengers.length + injections.length) / (injections.length + 1)) * (i + 1));
    const pos = Math.min(basePos + offset, passengers.length);
    passengers.splice(pos, 0, p);
    offset++;
  });

  return passengers;
}

// ─────────────────────────────────────────────────────────────
// DYNAMIC DIALOGUES (called from ui.js for complex branches)
// ─────────────────────────────────────────────────────────────
function getElias11Dialogue() {
  if (StoryState.flags.eliasArrested) {
    return {
      intro: 'A Ministry of Information officer presents Elias Brenner\'s press credentials. He watches your face carefully.',
      line: '"Brenner\'s credentials. We\'re closing his file. You processed him twice — anything reportable?"',
      choices: [
        { text: '"Nothing unusual. Routine processing."', key: 'cover',   effect: { loyalty: +2, corruption: +5 } },
        { text: '"He asked questions. I referred him on."', key: 'deflect', effect: { loyalty: +1 } },
        { text: '"He mentioned a hotel. Room 14."',        key: 'betray',  effect: { loyalty: +5, corruption: -5, compassion: -5 } },
      ],
      responses: {
        cover:   '"Good." *stamps something* "Cooperative officers are noted in their files."',
        deflect: '"Referred him where?" *writes something* "We may follow up."',
        betray:  '"Room 14." *nods slowly* "Very helpful. Very." *leaves without looking back*',
      },
    };
  }
  if (StoryState.flags.eliasTrusted) {
    return {
      intro: 'Elias. He slides documents through then waits until no one is watching.',
      line: '"I\'m ready to move. The editor has the first batch. I need badge numbers and dates — just what you personally witnessed — and then we go. Tonight if you want."',
      choices: [
        { text: '"I\'ll do it. Tonight."',          key: 'commit',  effect: { compassion: +5 }, flag: 'escapePossible' },
        { text: '"Not yet. I\'m not ready."',        key: 'stall',   effect: {} },
        { text: '"This ends here. Don\'t come back."', key: 'refuse', effect: { loyalty: +3 } },
      ],
      responses: {
        commit:  '"Good." *quiet exhale* "Continental Hotel. Room 14. Tonight after eleven. Bring what you need. Bring your family."',
        stall:   '"The window closes soon." *slides through* "I\'ll be at the hotel three more nights."',
        refuse:  '"I understand." *long pause* "Stay safe." *he never comes back after this*',
      },
    };
  }
  return {
    intro: 'Elias. Tired. He says nothing extra, just slides his passport.',
    line: '"Just passing through."',
    choices: [{ text: '"Papers are fine."', key: 'neutral', effect: {} }],
    responses: { neutral: '*nods. Picks up bag. Leaves.*' },
  };
}

function getReznik14Dialogue() {
  return CHARACTERS.reznik.appearances[14].dialogue;
}

// ─────────────────────────────────────────────────────────────
// DAY EVENT ACCESSORS
// ─────────────────────────────────────────────────────────────
function getDayStartEvent(day) {
  // Trigger ANIMUS glitch effects for this day (subtle, deferred)
  triggerAnimusGlitchForDay(day);

  const ev = DAY_EVENTS[day];
  if (!ev || !ev.start) return null;
  const e = ev.start;
  if (e.condition === 'eliasArrested' && !StoryState.flags.eliasArrested) return null;
  return e;
}

// Returns ANIMUS message to show after day bulletin, or null
function getAnimusDayMessage(day) {
  const msg = getAnimusMessageForDay(day);
  if (!msg) return null;
  // Mark as shown
  StoryState.animus.messagesShown.push(day);
  if (msg.onShow) msg.onShow(StoryState.animus.tasksFollowed > 0);
  return {
    type: 'animus',
    title: '◈ ANİMUS',
    text:  msg.text,
    isTask: msg.isTask || false,
    taskId: msg.taskId || null,
  };
}

function getDayEndEvent(day) {
  const ev = DAY_EVENTS[day];
  if (!ev || !ev.end) return null;
  const e = ev.end;
  if (e.dynamic === 'mirko_day10') {
    const collapsed = StoryState.flags.mirkoCollapsed;
    return {
      ...e,
      content: collapsed
        ? 'INCIDENT REPORT — 02:14 HRS: Civilian male found unresponsive at unmanned crossing, eastern perimeter. Identity: Mirko Jansen, Arstotzka. Transported to Grestin General. Condition: serious. Personal effects included medication and a child\'s photograph. Family notified.'
        : 'Transit worker reports: an elderly man crossed through Gate 3 yesterday. He was overheard saying something to no one in particular. The worker thought it sounded like a name.',
    };
  }
  return e;
}

// ─────────────────────────────────────────────────────────────
// DECISION & EFFECT RECORDING
// ─────────────────────────────────────────────────────────────
function recordCharacterDecision(charId, decision) {
  if (!StoryState.memory[charId]) StoryState.memory[charId] = [];
  StoryState.memory[charId].push(decision);

  // Consequence flags
  if (charId === 'amara' && decision === 'approve') {
    if (StoryState.dayDialogues['amara_7'] === 'apology') StoryState.flags.amaraSavedAnton = true;
  }
  if (charId === 'elias') {
    const denied = StoryState.memory.elias.filter(d => d === 'deny' || d === 'denied').length;
    if (denied >= 2) StoryState.flags.eliasArrested = true;
  }
  if (charId === 'mirko') {
    const denied = StoryState.memory.mirko.filter(d => d === 'deny').length;
    if (denied >= 2) StoryState.flags.mirkoCollapsed = true;
  }
  if (charId === 'lila') {
    const denied = StoryState.memory.lila.filter(d => d === 'deny').length;
    if (denied >= 2 && !StoryState.flags.lilaEscaped) StoryState.flags.lilaDeceased = true;
  }
  if (charId === 'vito') {
    const approved = StoryState.memory.vito.filter(d => d === 'approve').length;
    if (approved === 0 && StoryState.memory.vito.length >= 3) StoryState.flags.vitoAlive = false;
  }
  // PHANTOM target resolutions
  if (charId === 'miriam_voss') {
    StoryState.flags.task1Resolved = true;
    if (decision === 'approve') {
      const t = StoryState.phantom.tasks.find(t => t.taskId === 'task_1');
      if (t && t.accepted) { StoryState.phantom.trust += 15; StoryState.phantom.accepted++; }
    }
  }
  if (charId === 'agent_kolb') {
    StoryState.flags.task2Resolved = true;
    if (decision === 'deny') {
      const t = StoryState.phantom.tasks.find(t => t.taskId === 'task_2');
      if (t && t.accepted) { StoryState.phantom.trust += 20; StoryState.phantom.accepted++; }
    }
  }
  if (charId === 'red_thread_courier') {
    StoryState.flags.task4Resolved = true;
    if (decision === 'detain') {
      const t = StoryState.phantom.tasks.find(t => t.taskId === 'task_4');
      if (t && t.accepted) { StoryState.phantom.trust += 30; StoryState.phantom.accepted++; }
    }
  }

  // ANIMUS passenger resolutions
  if (charId === 'sara_khalid') {
    // ANIMUS task 1: let Sara through
    recordAnimusTask('animusTask1', decision === 'approve');
  }
}

function applyDialogueEffect(effect, key, charId, day) {
  if (!effect) return;
  const clamp = v => Math.max(0, Math.min(100, v));
  if (effect.loyalty)    StoryState.loyalty    = clamp(StoryState.loyalty    + effect.loyalty);
  if (effect.compassion) StoryState.compassion = clamp(StoryState.compassion + effect.compassion);
  if (effect.corruption) StoryState.corruption = clamp(StoryState.corruption + effect.corruption);
  if (effect.flag)       StoryState.flags[effect.flag] = true;
  if (effect.phantomBoost) StoryState.phantom.trust = Math.min(100, StoryState.phantom.trust + effect.phantomBoost);
  if (key) StoryState.dayDialogues[`${charId}_${day}`] = key;
}

function handlePhantomTaskGiven(taskId, choiceKey) {
  const task = PHANTOM_TASKS[taskId];
  if (!task) return;
  if (choiceKey === 'read' || choiceKey === 'accept' || choiceKey === 'maybe' || choiceKey === 'ask') {
    StoryState.phantom.contacted = true;
    StoryState.phantom.tasks.push({ taskId, accepted: true, completed: false });
    StoryState.flags[`${taskId.replace('_','')}_accepted`.replace('task','task')] = true;
    const flagKey = `task${taskId.split('_')[1]}Accepted`;
    StoryState.flags[flagKey] = true;
    StoryState.phantom.trust = Math.min(100, StoryState.phantom.trust + task.trustOnAccept);
  } else {
    StoryState.phantom.tasks.push({ taskId, accepted: false, completed: false });
    StoryState.phantom.trust = Math.max(0, StoryState.phantom.trust + task.trustOnRefuse);
    StoryState.phantom.refused++;
  }
}

function handlePhantomChoiceEffect(choiceKey, phantomAccept, phantomRefuse) {
  if (phantomAccept) handlePhantomTaskGiven(phantomAccept, choiceKey);
  if (phantomRefuse) {
    const task = PHANTOM_TASKS[phantomRefuse];
    if (task) {
      StoryState.phantom.tasks.push({ taskId: phantomRefuse, accepted: false, completed: false });
      StoryState.phantom.trust = Math.max(0, StoryState.phantom.trust + task.trustOnRefuse);
      StoryState.phantom.refused++;
    }
  }
}

function handleBribe(accepted) {
  StoryState.bribes.offered++;
  if (accepted) {
    StoryState.bribes.accepted++;
    StoryState.corruption = Math.min(100, StoryState.corruption + 20);
    StoryState.flags.briberAccepted = true;
    if (window.GameState) window.GameState.money += 150;
    if (StoryState.flags.task3Accepted) {
      StoryState.flags.task3Accepted = true;
      StoryState.phantom.trust = Math.min(100, StoryState.phantom.trust + 25);
      StoryState.phantom.accepted++;
      if (window.GameState) window.GameState.money += 200;
    }
  } else {
    StoryState.bribes.refused++;
    StoryState.loyalty = Math.min(100, StoryState.loyalty + 5);
  }
}

// ─────────────────────────────────────────────────────────────
// MORALITY-DRIVEN GAMEPLAY EFFECTS
// ─────────────────────────────────────────────────────────────
function getMoralityModifiers() {
  const ss = StoryState;
  return {
    // High compassion: supervisor occasionally overlooks single errors
    compassionBuffer: ss.compassion >= 60,
    // High loyalty: bonus salary on clean days
    loyaltyBonus: ss.loyalty >= 50,
    // High corruption: bribe offers increase, Reznik tracks you
    corruptionWatched: ss.corruption >= 40,
    // PHANTOM trust: they intervene if you're in danger
    phantomProtects: ss.phantom.trust >= 60,
    // Mixed: nothing special
    description: ss.loyalty > ss.corruption && ss.loyalty > ss.compassion ? 'loyal'
      : ss.compassion > ss.loyalty && ss.compassion > ss.corruption ? 'compassionate'
      : ss.corruption > 40 ? 'corrupt'
      : 'balanced',
  };
}

// ─────────────────────────────────────────────────────────────
// ENDINGS
// ─────────────────────────────────────────────────────────────
const ENDINGS = [
  {
    id: 'model_officer',
    title: 'MODEL OFFICER',
    condition: (gs, ss) => gs.day >= 14 && ss.loyalty >= 55 && ss.corruption <= 15 && ss.phantom.trust < 35,
    text: () => `Commander Reznik shakes your hand.

A real handshake. Not the polite kind.

"Your file is clean. Every warning reviewed. Every call made by the book. We need more officers like you."

A promotion letter sits on the table. Grestin Central. Better hours. Better pay.

You accept.

On the walk home, Anton is running in the corridor. He is healthy. Mirela is cooking.
You leave your badge by the door and sit down at the table.

It is quiet.

You do not think about the faces you turned away.
Or — you do. Sometimes. But less and less.

━━━━━━━━━━━━━━━━━━
ENDING: THE MODEL OFFICER
Days served: ${window.GameState ? window.GameState.day : '?'}
Score: ${window.GameState ? window.GameState.score.total : '?'}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'Loyalty won. The system is intact. You are intact. This is one kind of survival.',
  },
  {
    id: 'phantom_ally',
    title: 'THE INFORMANT',
    condition: (gs, ss) => ss.phantom.trust >= 60 && ss.phantom.accepted >= 2,
    text: () => {
      const vitoAlive = StoryState.flags.vitoAlive;
      return `The envelope is thin. Two items: a train ticket and a photograph.

The photograph is you, Mirela, Anton — taken from a distance but not threatening. Protective.

The ticket leaves tonight. Three seats.
${vitoAlive ? '\nVito is waiting at the eastern gate. He has a car, he says. He did not explain how he got it.' : ''}
Sister Mara is on the platform. She does not explain. She does not have to.

PHANTOM\'s records go public four weeks later.
Nineteen border officials named. Sixty-two disappearances documented.
The checkpoint is shut down for investigation.

Your name is not in the records.

You are somewhere else. Somewhere quieter.
You are not certain if what you did was right.
You are certain you did something.

━━━━━━━━━━━━━━━━━━
ENDING: THE INFORMANT
PHANTOM trust: ${StoryState.phantom.trust}
Tasks completed: ${StoryState.phantom.accepted}
━━━━━━━━━━━━━━━━━━`;
    },
    moralNote: 'The faction chose well. Or you chose them. Hard to say which.',
  },
  {
    id: 'arrested',
    title: 'ARRESTED',
    condition: (gs, ss) => ss.corruption >= 50 && ss.loyalty <= 20,
    text: () => `Reznik arrives with two officers. He doesn't knock.

They find the envelope. The notes. The approvals that shouldn't have been approvals.

He doesn't look angry. He looks tired.

"I gave you a chance to come clean," he says.

He's right. You didn't take it.

The booth is empty by afternoon.
A new officer is briefed. He looks young.
He has the same expression you had on Day 1.

Your family is informed.
Anton asks when you're coming home.
${StoryState.bribes.accepted > 0 ? `\nThe $${StoryState.bribes.accepted * 150} they found in your drawer does not help your case.` : ''}

━━━━━━━━━━━━━━━━━━
ENDING: ARRESTED
Corruption: ${StoryState.corruption}
Days served: ${window.GameState ? window.GameState.day : '?'}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'The system caught you. Or maybe you let it.',
  },
  {
    id: 'humanitarian',
    title: 'THE HUMANITARIAN',
    condition: (gs, ss) => ss.compassion >= 65 && ss.loyalty <= 45 && gs.day >= 13,
    text: () => `They found the pattern in your approvals.
The expired passports, the missing forms — all people, they noted, who had nowhere else to go.

The International Border Rights Council writes.
They offer you a position: Observer. No uniform. No booth.

You are also fired. Effective immediately.

${StoryState.flags.amaraSavedAnton ? 'Dr. Osei sends a note. Anton\'s last check-up came back clear. "He is a brave child," she writes. "Like his parent."' : ''}

You tell Mirela at dinner.
She doesn't say anything for a long time.
Then: "Was it worth it?"

You think of Mirko walking through the gate.
You think of Lila's face when you said you believed her.

"I think so," you say.

She nods. It's not agreement. It's something more complicated.

━━━━━━━━━━━━━━━━━━
ENDING: THE HUMANITARIAN
Compassion: ${StoryState.compassion}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'The rules said no. You said maybe. Enough maybes make a difference.',
  },
  {
    id: 'escape',
    title: 'THE ESCAPE',
    condition: (gs, ss) => ss.flags.eliasTrusted && !ss.flags.eliasArrested && ss.flags.escapePossible,
    text: () => `Elias is already packed. Three passports — real ones, clean.
${StoryState.flags.lilaEscaped ? 'Lila is there too. She has found eleven people, including Tomas. They are already across.' : ''}

You pack one bag. You leave the badge on the counter.

"Where are we going?" Mirela asks.

"Away from here," you say.

The crossing is a different checkpoint.
A different officer. He looks at your documents and waves you through without looking up.

You watch the border disappear in the rearview mirror.

Elias's story runs six days later.
Your name is not in it. That was the deal.

What is in it changes things. Slowly. The way things change.

━━━━━━━━━━━━━━━━━━
ENDING: THE ESCAPE
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'Some exits are not failures. Some are the only honest move left.',
  },
  // ── ANIMUS ENDINGS ───────────────────────────────────────────
  {
    id: 'animus_icgudü',
    title: 'İÇGÜDÜ',
    condition: (gs, ss) => ss.animus.alignment >= 65 && ss.animus.tasksFollowed >= 3 && gs.day >= 14,
    text: () => `There is no letter.
No handshake. No ceremony.

One morning the ◈ is gone — not from the corner of the screen, but from your thinking.
It was never there. Or it was always there, and you have become it.

You look back at the queue.
The same faces. Different people. Same fear.

But now you see what the fear is about.

The files have gaps. The approvals that were supposed to happen, that you were supposed to prevent.
You were not stopping crime.
You were selecting who gets to live inside the wall.

${StoryState.animus.tasksCompleted.includes('animusTask1Done') ? 'Sara Khalid made it. You read it in a report someone accidentally left on the desk. Case closed. Unknown transit.' : ''}

You finish your shift.
You walk out at 17:00.
You do not go back.

━━━━━━━━━━━━━━━━━━
SON: İÇGÜDÜ / INSTINCT
ANİMUS hizalaması: ${StoryState.animus.alignment}
Tamamlanan görevler: ${StoryState.animus.tasksFollowed}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'The faction did not recruit you. You recruited yourself.',
  },
  {
    id: 'animus_sessizlik',
    title: 'SESSİZLİK',
    condition: (gs, ss) => ss.animus.alignment <= 10 && gs.day >= 15,
    text: () => `The slips stopped coming.

Maybe you stopped reading them. Maybe they stopped sending.
Either way — the ◈ doesn't appear anymore, and you find yourself checking for it.

That is not a healthy sign.

You go back to procedures. You follow the rulebook.
Every day is like the one before.

In the evenings you sometimes hear about things.
Families turned away. Detentions without review.
The kind of thing you used to be part of. Or not part of. You are not sure anymore.

The silence is an answer.
But you do not know what the question was.

━━━━━━━━━━━━━━━━━━
SON: SESSİZLİK / SILENCE
Gün: ${window.GameState ? window.GameState.day : '?'}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'Some alliances end with argument. Some end with nothing at all.',
  },
  {
    id: 'animus_arac',
    title: 'ARAÇ',
    condition: (gs, ss) => ss.flags.animusAllBlind && gs.day >= 18,
    text: () => `You followed every instruction.

No questions. No hesitation.
They said: let her through. You did.
They said: approve the next three. You did.
They said: trust us. You did.

You never knew why.
You never asked.

The last slip says only:

    "You were useful."

That is all.

The ◈ does not appear again.
The booth smells the same. The line moves the same.
You are the same.

In three weeks, a report surfaces. Six people, coordinated, accessed restricted areas using approvals traced to your booth. You do not understand all of it. You understand enough.

You were a door. Someone opened you. Someone closed you.
You are still here, holding the stamp.

━━━━━━━━━━━━━━━━━━
SON: ARAÇ / INSTRUMENT
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'You can be used for good or ill while believing you chose. This is the oldest story.',
  },

  {
    id: 'forgotten',
    title: 'THE FORGOTTEN',
    condition: (gs) => gs.day >= 20,
    text: () => `Day twenty.

The roster comes. You are on it again tomorrow.

Nothing changed. Nothing ended.
The line outside the booth is the same length it was on Day 1.

You have processed ${window.GameState ? window.GameState.processed + (window.GameState.day - 1) * 8 : 'many'} people.
You remember faces but not names.
You remember names but not what they needed.

You go home. You eat. Your family is alive.

Some nights you wonder about the ones you turned away.
Most nights you don't.

The booth opens at eight.
You will be there.

━━━━━━━━━━━━━━━━━━
ENDING: THE FORGOTTEN
Days completed: ${window.GameState ? window.GameState.day : '?'}
━━━━━━━━━━━━━━━━━━`,
    moralNote: 'This is how most stories end. Not with a bang. With a booth opening at eight.',
  },
];

// ─────────────────────────────────────────────────────────────
// ENDING CHECK
// ─────────────────────────────────────────────────────────────
function checkEndingConditions() {
  const gs = window.GameState;
  const ss = StoryState;
  if (!gs) return null;
  for (const ending of ENDINGS) {
    if (ending.id === 'forgotten') continue;
    if (ending.condition(gs, ss)) return ending;
  }
  if (gs.day >= 20) return ENDINGS.find(e => e.id === 'forgotten');
  return null;
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
window.StoryState               = StoryState;
window.CHARACTERS               = CHARACTERS;
window.ENDINGS                  = ENDINGS;
window.DAY_EVENTS               = DAY_EVENTS;
window.RULEBOOK                 = RULEBOOK;
window.PHANTOM_TASKS            = PHANTOM_TASKS;
window.PHANTOM_PASSENGERS       = PHANTOM_PASSENGERS;
window.SPECIAL_PASSENGERS       = SPECIAL_PASSENGERS;
window.ANIMUS_PASSENGERS        = ANIMUS_PASSENGERS;
window.injectStoryPassengers    = injectStoryPassengers;
window.getDayStartEvent         = getDayStartEvent;
window.getAnimusDayMessage      = getAnimusDayMessage;
window.getDayEndEvent           = getDayEndEvent;
window.recordCharacterDecision  = recordCharacterDecision;
window.recordAnimusTask         = recordAnimusTask;
window.applyDialogueEffect      = applyDialogueEffect;
window.handlePhantomChoiceEffect = handlePhantomChoiceEffect;
window.handlePhantomTaskGiven   = handlePhantomTaskGiven;
window.handleBribe              = handleBribe;
window.checkEndingConditions    = checkEndingConditions;
window.getElias11Dialogue       = getElias11Dialogue;
window.getRulesForDay           = getRulesForDay;
window.getMoralityModifiers     = getMoralityModifiers;
window.resolve                  = resolve;

window._genMRZ = function(surname, given, nation, dob, passNo, expiry, sex) {
  const padR = (s, l, c='<') => (String(s||'').replace(/[^A-Z0-9]/gi,'<').toUpperCase() + c.repeat(l)).substring(0,l);
  const nat = String(nation||'').substring(0,3).toUpperCase().padEnd(3,'<');
  const line1 = `P<${nat}${padR(surname,39)}`;
  const pn    = padR(String(passNo||'').replace(/-/g,''), 9);
  const dobF  = String(dob||'').replace(/\./g,'').substring(2);
  const expF  = String(expiry||'').replace(/\./g,'').substring(2);
  const line2 = `${pn}0${nat}${dobF}${(sex||'M')==='M'?'0':'1'}${expF}0${padR(given,14)}`;
  return [line1, line2];
};

console.log('[STORY v2] Loaded. Characters:', Object.keys(CHARACTERS).length, '| PHANTOM tasks:', Object.keys(PHANTOM_TASKS).length, '| Endings:', ENDINGS.length);
