// Simple per-source failure tracker for exponential backoff.
// Does NOT add extra requests — only delays retries after errors.

const state = new Map<string, { failures: number; nextAllowed: number }>();

export function shouldSkip(source: string): boolean {
  const s = state.get(source);
  if (!s || s.failures === 0) return false;
  return Date.now() < s.nextAllowed;
}

export function onSuccess(source: string): void {
  state.delete(source);
}

export function onFailure(source: string): void {
  const s = state.get(source) ?? { failures: 0, nextAllowed: 0 };
  s.failures = Math.min(s.failures + 1, 5);
  // Backoff: 5s, 10s, 20s, 40s, 60s
  const delaySec = Math.min(5 * Math.pow(2, s.failures - 1), 60);
  s.nextAllowed = Date.now() + delaySec * 1000;
  state.set(source, s);
}
