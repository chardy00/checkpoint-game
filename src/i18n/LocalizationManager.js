/* ================================================================
   CHECKPOINT — LocalizationManager
   Replaces the global window.t / window.setLanguage / window._getLang
   pattern from lang.js with a proper class-based system.

   USAGE (new architecture):
     import { LocalizationManager } from './LocalizationManager.js';
     const loc = new LocalizationManager('tr');
     loc.getText('btn.approve')           // → 'Onayla'
     loc.getText('summary.report', {day:3}) // → 'GÜN 3 — VARDİYA RAPORU'
     loc.resolve({ en: 'Hello', tr: 'Merhaba' }) // → 'Merhaba'

   BACKWARD COMPATIBILITY:
     LocalizationManager.install(instance) patches window.t, window.bi,
     window.setLanguage, window._getLang, window.applyI18n so that the
     existing game files continue to work unchanged.
================================================================ */

import { EN } from './translations/en.js';
import { TR } from './translations/tr.js';

const SUPPORTED = { en: EN, tr: TR };

export class LocalizationManager {

  /**
   * @param {string} initialLang  — 'en' | 'tr'  (default: 'en')
   */
  constructor(initialLang = 'en') {
    this._lang      = SUPPORTED[initialLang] ? initialLang : 'en';
    this._listeners = [];  // callbacks registered via registerListener()
  }

  // ── CORE ───────────────────────────────────────────────────────

  /**
   * Return the current language code.
   * @returns {'en'|'tr'}
   */
  getCurrentLanguage() {
    return this._lang;
  }

  /**
   * Translate a key with optional {param} substitution.
   * Falls back to English, then to the bare key if both miss.
   * @param {string} key
   * @param {Object} [params]
   * @returns {string}
   */
  getText(key, params) {
    const dict = SUPPORTED[this._lang] || EN;
    let str = dict[key] ?? EN[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }

  /**
   * Resolve a bilingual object or plain string to the current language.
   *
   * Accepts:
   *   { en: 'Hello', tr: 'Merhaba' }  → 'Merhaba'  (when lang = tr)
   *   'Hello'                         → 'Hello'
   *   () => ({ en:'...', tr:'...' })   → resolved recursively
   *   null / undefined                → ''
   *
   * This is the canonical way to render dynamic story content stored
   * in /data/ as bilingual objects.
   */
  resolve(val) {
    if (val === null || val === undefined) return '';
    if (typeof val === 'function')        return this.resolve(val());
    if (
      typeof val === 'object' &&
      !Array.isArray(val) &&
      (val.en !== undefined || val.tr !== undefined)
    ) {
      const lang = this._lang;
      return (lang === 'tr' && val.tr) ? val.tr : (val.en || '');
    }
    return String(val);
  }

  // ── LANGUAGE SWITCHING ─────────────────────────────────────────

  /**
   * Switch the active language, persist to localStorage, notify listeners,
   * and trigger a DOM refresh via applyI18n if available.
   * @param {'en'|'tr'} lc
   */
  setLanguage(lc) {
    if (!SUPPORTED[lc]) {
      console.warn(`[Localization] Unknown language: ${lc}`);
      return;
    }
    this._lang = lc;

    try {
      const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
      s.language = lc;
      localStorage.setItem('chk_settings', JSON.stringify(s));
    } catch (_) {}

    this._notify(lc);
    this._refreshDOM();
  }

  /**
   * Load saved language preference from localStorage.
   * Call once during initialisation.
   */
  loadSavedLanguage() {
    try {
      const s = JSON.parse(localStorage.getItem('chk_settings') || '{}');
      if (s.language && SUPPORTED[s.language]) this._lang = s.language;
    } catch (_) {}
    return this;
  }

  // ── LISTENERS ─────────────────────────────────────────────────

  /**
   * Register a callback that fires whenever the language changes.
   * @param {(lang: string) => void} callback
   * @returns {() => void}  unsubscribe function
   */
  registerListener(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  }

  // ── DOM HELPERS ────────────────────────────────────────────────

  /**
   * Update all DOM elements that carry a data-i18n / data-i18n-html attribute.
   */
  applyI18n() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.getText(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = this.getText(el.dataset.i18nHtml);
    });
    document.title = this.getText('init.title');
  }

  // ── BACKWARD COMPATIBILITY ─────────────────────────────────────

  /**
   * Patch global window.* symbols so that the existing game files
   * (lang.js, ui.js, game.js …) continue to work without modification.
   *
   * After calling this, the old lang.js file can be removed once all
   * callers have migrated to the new API.
   *
   * @param {LocalizationManager} instance
   */
  static install(instance) {
    window.t         = (key, params) => instance.getText(key, params);
    window.bi        = (val)         => instance.resolve(val);
    window.setLanguage = (lc)        => instance.setLanguage(lc);
    window._getLang  = ()            => instance.getCurrentLanguage();
    window.applyI18n = ()            => instance.applyI18n();

    // Keep a reference so any module can reach the manager
    window._localization = instance;

    console.log('[LocalizationManager] Installed. Lang:', instance.getCurrentLanguage());
  }

  // ── PRIVATE ────────────────────────────────────────────────────

  _notify(lc) {
    this._listeners.forEach(cb => { try { cb(lc); } catch (_) {} });
  }

  _refreshDOM() {
    this.applyI18n();
    if (typeof window !== 'undefined' && typeof window.updateBulletinBoard === 'function') {
      window.updateBulletinBoard();
    }
    // Refresh action-bar button labels (.btn-label spans)
    const labels = {
      'btn-approve': 'btn.approve',
      'btn-deny':    'btn.deny',
      'btn-detain':  'btn.detain',
      'btn-flag':    'btn.flag',
    };
    if (typeof document === 'undefined') return;
    Object.entries(labels).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const lbl = el.querySelector('.btn-label');
      const full = this.getText(key);
      if (lbl) {
        lbl.textContent = full.replace(/^[✓✗▲⚑≡⚙\s]+/, '').toUpperCase();
      } else {
        el.textContent = full;
      }
    });
  }
}
