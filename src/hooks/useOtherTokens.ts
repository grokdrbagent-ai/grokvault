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
    poll();
    const timer = setInterval(poll, 120_000);
    return () => clearInterval(timer);
  }, [poll]);

  return data;
}
