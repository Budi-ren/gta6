// Versioned localStorage saves. The save is a patch-merge: callers pass only
// the fields that changed, and the stored record always carries its schema
// version and a timestamp so a stale save from an older build never loads.
import { SAVE_KEY, SAVE_VERSION } from './config.js';

function defaults() {
  return {
    version: SAVE_VERSION,
    money: 500,
    missionsCompleted: 0,
    bestWanted: 0,
    carsStolen: 0,
    nearMisses: 0,
    muted: false,
    savedAt: 0,
  };
}

export function loadGameSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) return defaults();
    return { ...defaults(), ...parsed };
  } catch {
    return defaults();
  }
}

export function saveGameData(patch) {
  try {
    const merged = { ...loadGameSave(), ...patch, version: SAVE_VERSION, savedAt: Date.now() };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable; nothing to clear
  }
}
