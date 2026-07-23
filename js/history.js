/**
 * History Manager
 *
 * Persists calculation history to localStorage and manages the UI list.
 * Max 50 entries; oldest entries are evicted when the limit is reached.
 */

"use strict";

class HistoryManager {
  /** @param {number} maxEntries - maximum history items to store */
  constructor(maxEntries = 50) {
    this.STORAGE_KEY = "calc_history";
    this.maxEntries = maxEntries;
    this.entries = this._load();
  }

  /**
   * Add a new calculation to history.
   * @param {string} expression - e.g. "12 + 3"
   * @param {string} result - e.g. "15"
   */
  add(expression, result) {
    const entry = {
      id: Date.now(),
      expression,
      result,
      timestamp: new Date().toISOString(),
    };

    this.entries.unshift(entry);

    // Trim to max
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    this._save();
  }

  /** Clear all history entries */
  clear() {
    this.entries = [];
    this._save();
  }

  /** @returns {Array} current entries (newest first) */
  getAll() {
    return this.entries;
  }

  /** @returns {boolean} whether there are any entries */
  isEmpty() {
    return this.entries.length === 0;
  }

  // ---- Persistence ----

  /** Load entries from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /** Save entries to localStorage */
  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }
}
