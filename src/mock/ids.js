// Small deterministic helpers shared by every mock/*.js seed generator.
// A seeded PRNG (rather than raw Math.random()) keeps re-seeds and the
// live ticker's "next tick" behavior reproducible across reloads.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

export function seededRandom(seed) {
  return mulberry32(typeof seed === "number" ? seed : hashSeed(seed));
}

let counter = 0;
export function nextId(prefix) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

export function randInt(rand, min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randRange(rand, min, max) {
  return rand() * (max - min) + min;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
