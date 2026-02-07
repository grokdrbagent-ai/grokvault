"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchLargeBuys, LargeBuy } from "@/lib/swapScanner";

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

  const poll = useCallback(async () => {
    if (!currentDRBPrice || currentDRBPrice <= 0) return;

    try {
      const result = await fetchLargeBuys(currentDRBPrice);

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
      // Keep previous data
    } finally {
      setLoading(false);
    }
  }, [currentDRBPrice]);

  useEffect(() => {
    // Delay initial fetch by 8s to avoid competing with wallet data load
    const initialDelay = setTimeout(poll, 8_000);
    const timer = setInterval(poll, 90_000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(timer);
    };
  }, [poll]);

  return { buys, loading, newBuyCount };
}
