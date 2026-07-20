export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
