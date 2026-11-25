// A tiny seeded random number generator (mulberry32), so a screenshot seed
// always deals the same orders and the same kitchen.
export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function intBelow(n) {
    return Math.floor(next() * n);
  }
  function pick(list) {
    return list[intBelow(list.length)];
  }
  function weighted(entries) {
    let total = 0;
    for (const entry of entries) total += entry.weight;
    let roll = next() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  }
  return { next, range, intBelow, pick, weighted };
}
