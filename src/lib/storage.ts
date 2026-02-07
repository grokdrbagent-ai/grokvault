// Safe localStorage wrappers with SSR guard

const PREFIX = "grokvault_";

function getItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // localStorage full or blocked
  }
}

// --- ATH Tracking ---

interface ATHData {
  value: number;
  timestamp: number;
}

export function getATH(): ATHData | null {
  const value = getItem("ath_value");
  const timestamp = getItem("ath_timestamp");
  if (!value || !timestamp) return null;
  return { value: parseFloat(value), timestamp: parseInt(timestamp, 10) };
}

export function updateATH(currentValue: number): { isNewATH: boolean; ath: ATHData } {
  const existing = getATH();
  if (!existing || currentValue > existing.value) {
    const ath = { value: currentValue, timestamp: Date.now() };
    setItem("ath_value", ath.value.toString());
    setItem("ath_timestamp", ath.timestamp.toString());
    return { isNewATH: !!existing, ath };
  }
  return { isNewATH: false, ath: existing };
}

// --- Visit Tracking ---

interface VisitData {
  timestamp: number;
  totalValueUSD: number;
  fees7d: number;
}

export function getLastVisit(): VisitData | null {
  const raw = getItem("last_visit");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VisitData;
  } catch {
    return null;
  }
}

export function saveVisit(totalValueUSD: number, fees7d: number): void {
  const data: VisitData = {
    timestamp: Date.now(),
    totalValueUSD,
    fees7d,
  };
  setItem("last_visit", JSON.stringify(data));
}
