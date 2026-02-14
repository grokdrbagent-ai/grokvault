"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchLargeBuys, LargeBuy } from "@/lib/swapScanner";
import { shouldSkip, onSuccess, onFailure } from "@/lib/backoff";
import { POLLING } from "@/lib/constants";
import { usePageVisible } from "@/hooks/usePageVisible";

interface UseLargeBuysReturn {
  buys: LargeBuy[];
  loading: boolean;
  newBuyCount: number;
}

export function useLargeBuys(currentDRBPrice: number | null): UseLargeBuysReturn {
  const [buys, setBuys] = useState<LargeBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBuyCount, setNewBuyCount] = useState(0);
  const knownHashesRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const visible = usePageVisible();
  const visibleRef = useRef(true);
  visibleRef.current = visible;

  const poll = useCallback(async () => {
    if (!currentDRBPrice || currentDRBPrice <= 0) return;
    if (!visibleRef.current) return;
    if (shouldSkip("largeBuys")) return;

    try {
      const result = await fetchLargeBuys(currentDRBPrice);
      onSuccess("largeBuys");
      if (!mountedRef.current) return;

      // Detect new buys
      if (knownHashesRef.current.size > 0) {
        const newOnes = result.filter((b) => !knownHashesRef.current.has(b.hash));
        if (newOnes.length > 0) {
          setNewBuyCount((c) => c + newOnes.length);
        }
      }

      knownHashesRef.current = new Set(result.map((b) => b.hash));
      setBuys(result);
    } catch {
      onFailure("largeBuys");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [currentDRBPrice]);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    const timer = setInterval(poll, POLLING.LARGE_BUYS_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [poll]);

  return { buys, loading, newBuyCount };
}
