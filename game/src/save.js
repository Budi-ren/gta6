// LocalStorage save and load for player money, missions completed, and stats.
import { SAVE_KEY } from './config.js';

export function loadGameSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // localStorage disabled or private mode
  }
  return {
    money: 500,
    missionsCompleted: 0,
    bestWanted: 0,
  };
}

export function saveGameData(data) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
