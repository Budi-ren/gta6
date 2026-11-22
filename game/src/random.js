// Seeded PRNG for deterministic gameplay and screenshots
let seed = 1;

export function setSeed(s) {
  seed = s;
}

export function random() {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

export function randomRange(min, max) {
  return min + random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}
