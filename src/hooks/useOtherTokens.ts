"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchOtherTokens, OtherTokensData } from "@/lib/api";
import { shouldSkip, onSuccess, onFailure } from "@/lib/backoff";
import { POLLING } from "@/lib/constants";
import { usePageVisible } from "@/hooks/usePageVisible";

export function useOtherTokens(ethPrice: number): OtherTokensData {
  const [data, setData] = useState<OtherTokensData>({
    othersValueUSD: 0,
    othersTokenCount: 0,
    ethBalance: 0,
    ethValueUSD: 0,
  });
  const mountedRef = useRef(true);
  const visible = usePageVisible();
  const visibleRef = useRef(true);
  visibleRef.current = visible;

  const poll = useCallback(async () => {
    if (ethPrice <= 0) return;
    if (!visibleRef.current) return;
    if (shouldSkip("otherTokens")) return;
    try {
      const result = await fetchOtherTokens(ethPrice);
      onSuccess("otherTokens");
      if (mountedRef.current) setData(result);
    } catch {
      onFailure("otherTokens");
    }
  }, [ethPrice]);

  useEffect(() => {
    mountedRef.current = true;
    poll();
    const timer = setInterval(poll, POLLING.OTHER_TOKENS_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [poll]);

  return data;
}
