// SplitMix32: a tiny deterministic generator with a different mixing chain
// from the usual mulberry32, so the city layout and traffic are reproducible
// from a seed without depending on Math.random anywhere in the game.
let state = 0x9e3779b9;

export function setSeed(s) {
  state = (s >>> 0) || 1;
}

export function random() {
  state = (state + 0x9e3779b9) | 0;
  let z = state;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
  return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
}

export function range(min, max) {
  return min + random() * (max - min);
}

export function int(min, max) {
  return Math.floor(range(min, max + 1));
}

export function pick(list) {
  return list[Math.floor(random() * list.length)];
}

export function chance(p) {
  return random() < p;
}

export function shuffle(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
