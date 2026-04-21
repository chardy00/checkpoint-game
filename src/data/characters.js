/* ================================================================
   CHECKPOINT — Characters Data
   Pure data module. Zero logic, zero DOM, zero side-effects.

   Static metadata for the 7 recurring story characters.
   Dialogue closures (which reference StoryState) remain in story.js
   until that file is fully migrated.

   This module provides the authoritative list of characters:
   their identity, document details per appearance, and which
   decision is correct — all the parts that are pure data.

   Exports:
     CHARACTER_META   — lightweight identity records
     PHANTOM_META     — PHANTOM passenger identities
     ANIMUS_META      — ANIMUS passenger identities
================================================================ */

/**
 * Lightweight identity records for the 7 recurring characters.
 * Includes passport details per appearance (anomalies, correctDecision)
 * but NOT dialogue closures (those reference live StoryState).
 */
export const CHARACTER_META = {
  vito: {
    id: 'vito',
    name: 'Vito Cortez',
    nation: 'ITA', sex: 'M',
    dob: '1971.06.14', height: 172, weight: 84,
    issueCity: 'Naples', icon: '◆',
    appearances: {
      2:  { hasPassport: false, correctDecision: 'deny',    passportNumber: null,         expiry: null },
      5:  { hasPassport: true,  correctDecision: 'deny',    passportNumber: 'IMP-0042-X', expiry: '2029.01.01' },
      9:  { hasPassport: true,  correctDecision: 'approve', passportNumber: 'IMP-7741-C', expiry: '2030.06.30' },
      13: { hasPassport: true,  correctDecision: 'approve', passportNumber: 'IMP-7741-C', expiry: '2030.06.30' },
    },
  },
  amara: {
    id: 'amara',
    name: 'Amara Osei',
    nation: 'NLD', sex: 'F',
    dob: '1978.03.22', height: 163, weight: 58,
    issueCity: 'Amsterdam', icon: '✚',
    appearances: {
      3: { hasPassport: true, correctDecision: 'deny',    passportNumber: 'KOL-2219-H', expiry: '2026.04.10' },
      7: { hasPassport: true, correctDecision: 'approve', passportNumber: 'KOL-3301-H', expiry: '2027.08.15' },
    },
  },
  reznik: {
    id: 'reznik',
    name: 'Darius Reznik',
    nation: 'TUR', sex: 'M',
    dob: '1960.11.01', height: 185, weight: 95,
    issueCity: 'Ankara', icon: '◉',
    appearances: {
      4:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'ARS-9901-R', expiry: '2030.01.01', isOfficer: true },
      8:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'ARS-9901-R', expiry: '2030.01.01', isOfficer: true },
      14: { hasPassport: true, correctDecision: 'approve', passportNumber: 'ARS-9901-R', expiry: '2030.01.01', isOfficer: true },
    },
  },
  mara: {
    id: 'mara',
    name: 'Sister Mara Venn',
    nation: 'GRC', sex: 'F',
    dob: '1982.07.11', height: 168, weight: 61,
    issueCity: 'Athens', icon: '⬡',
    appearances: {
      6:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'PHN-0001-M', expiry: '2029.11.30' },
      10: { hasPassport: true, correctDecision: 'approve', passportNumber: 'PHN-0001-M', expiry: '2029.11.30' },
      16: { hasPassport: true, correctDecision: 'approve', passportNumber: 'PHN-0001-M', expiry: '2029.11.30' },
    },
  },
  elias: {
    id: 'elias',
    name: 'Elias Wren',
    nation: 'DEU', sex: 'M',
    dob: '1995.02.28', height: 176, weight: 70,
    issueCity: 'Berlin', icon: '◇',
    appearances: {
      5:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'DEU-5512-E', expiry: '2028.05.01' },
      11: { hasPassport: true, correctDecision: 'approve', passportNumber: 'DEU-5512-E', expiry: '2028.05.01' },
    },
  },
  mirko: {
    id: 'mirko',
    name: 'Mirko Hasek',
    nation: 'POL', sex: 'M',
    dob: '1958.09.03', height: 170, weight: 78,
    issueCity: 'Warsaw', icon: '▣',
    appearances: {
      4:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'POL-0088-H', expiry: '2025.12.31' },
      12: { hasPassport: true, correctDecision: 'approve', passportNumber: 'POL-0089-H', expiry: '2027.06.30' },
    },
  },
  lila: {
    id: 'lila',
    name: 'Lila Dorn',
    nation: 'ROU', sex: 'F',
    dob: '2001.05.19', height: 160, weight: 52,
    issueCity: 'Bucharest', icon: '✦',
    appearances: {
      7:  { hasPassport: true, correctDecision: 'approve', passportNumber: 'ROU-7731-D', expiry: '2029.03.15' },
      15: { hasPassport: true, correctDecision: 'approve', passportNumber: 'ROU-7731-D', expiry: '2029.03.15' },
      19: { hasPassport: true, correctDecision: 'approve', passportNumber: 'ROU-7731-D', expiry: '2029.03.15' },
    },
  },
};

/**
 * PHANTOM target passenger identities (static parts only).
 * Full definitions (anomalies, dialogue) remain in story.js.
 */
export const PHANTOM_META = {
  nadia_sol: {
    id: 'nadia_sol',
    name: { en: 'Nadia Sol', tr: 'Nadia Sol' },
    nation: 'UKR', sex: 'F',
    passportNumber: 'UKR-PHN-001',
    day: 13,
    correctDefault:    'deny',
    correctIfAccepted: 'approve',
  },
  milos_vark: {
    id: 'milos_vark',
    name: { en: 'Milos Vark', tr: 'Milos Vark' },
    nation: 'ROU', sex: 'M',
    passportNumber: 'ROU-PHN-002',
    day: 17,
    correctDefault:    'approve',
    correctIfAccepted: 'deny',
  },
  tomasz_bren: {
    id: 'tomasz_bren',
    name: { en: 'Tomasz Bren', tr: 'Tomasz Bren' },
    nation: 'POL', sex: 'M',
    passportNumber: 'POL-PHN-003',
    day: 20,
    correctDefault:    'approve',
    correctIfAccepted: 'detain',
  },
};

/**
 * ANIMUS passenger identities (static parts).
 */
export const ANIMUS_META = {
  sara_khalid: {
    id: 'sara_khalid',
    firstName: 'Sara', lastName: 'Khalid',
    nation: 'SYR', sex: 'F',
    dob: '1991.03.22', height: 162, weight: 55,
    issueCity: 'Damascus',
    passportNumber: 'SYR-◈-9917',
    expiry: '2028.06.01',
    day: 13,
    correctDecision: 'approve',
    animusNote: true,
  },
};
