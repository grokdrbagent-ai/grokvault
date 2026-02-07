"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchOtherTokens, OtherTokensData } from "@/lib/api";

export function useOtherTokens(ethPrice: number): OtherTokensData {
  const [data, setData] = useState<OtherTokensData>({
    othersValueUSD: 0,
    othersTokenCount: 0,
    ethBalance: 0,
    ethValueUSD: 0,
  });

  const poll = useCallback(async () => {
    if (ethPrice <= 0) return;
    try {
      const result = await fetchOtherTokens(ethPrice);
      setData(result);
    } catch {
      // Keep previous data
    }
  }, [ethPrice]);

  useEffect(() => {
    // Delay initial fetch by 5s to avoid competing with main data load
    const initialDelay = setTimeout(poll, 5_000);
    const timer = setInterval(poll, 120_000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(timer);
    };
  }, [poll]);

  return data;
}
