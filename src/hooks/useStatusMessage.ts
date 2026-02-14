"use client";

import { useState, useEffect, useRef } from "react";
import { getLastVisit, saveVisit } from "@/lib/storage";
import { formatUSD } from "@/lib/game";

export type StatusTone = "positive" | "negative" | "exciting" | "neutral";

interface UseStatusMessageReturn {
  message: string;
  tone: StatusTone;
}

export function useStatusMessage(
  totalValueUSD: number | null,
  change24h: number | null,
  earningsUSD: number
): UseStatusMessageReturn {
  const [result, setResult] = useState<UseStatusMessageReturn>({
    message: "accumulating...",
    tone: "neutral",
  });
  const lastSaveRef = useRef(0);
  // Capture the visit snapshot once per session so the "away" message stays stable
  const visitSnapshotRef = useRef<ReturnType<typeof getLastVisit> | undefined>(undefined);

  useEffect(() => {
    if (totalValueUSD === null || change24h === null) return;

    // Read last visit only once per session
    if (visitSnapshotRef.current === undefined) {
      visitSnapshotRef.current = getLastVisit();
    }
    const lastVisit = visitSnapshotRef.current;

    const now = Date.now();
    const hour = new Date().getHours();

    let message = "accumulating...";
    let tone: StatusTone = "neutral";

    if (lastVisit) {
      const elapsedMs = now - lastVisit.timestamp;
      const elapsedHours = elapsedMs / (1000 * 60 * 60);
      const valueDiff = totalValueUSD - lastVisit.totalValueUSD;

      if (elapsedHours > 4 && valueDiff > 0) {
        message = `grok earned ${formatUSD(valueDiff)} while you were away`;
        tone = "positive";
      } else if (elapsedHours > 4 && valueDiff < 0) {
        message = `grok lost ${formatUSD(Math.abs(valueDiff))} since your last visit`;
        tone = "negative";
      } else if (change24h > 10) {
        message = `DRB is flying: +${change24h.toFixed(1)}% today`;
        tone = "exciting";
      } else if (change24h < -10) {
        message = "dip in progress... diamond hands";
        tone = "negative";
      } else if (hour >= 1 && hour < 6) {
        message = "late night degen check";
        tone = "neutral";
      } else if (hour >= 6 && hour < 12) {
        message = "gm. grok never sleeps";
        tone = "neutral";
      } else {
        message = "accumulating...";
        tone = "neutral";
      }
    } else {
      message = "first time? grok's been busy";
      tone = "neutral";
    }

    setResult({ message, tone });

    // Save visit data (throttled to once per 5 min)
    if (now - lastSaveRef.current > 5 * 60 * 1000) {
      saveVisit(totalValueUSD, earningsUSD);
      lastSaveRef.current = now;
    }
  }, [totalValueUSD, change24h, earningsUSD]);

  return result;
}
