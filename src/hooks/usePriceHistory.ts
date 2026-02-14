"use client";

import { useState, useEffect, useRef } from "react";
import { fetchDRBPriceHistory, PricePoint } from "@/lib/api";
import { shouldSkip, onSuccess, onFailure } from "@/lib/backoff";
import { POLLING } from "@/lib/constants";
import { usePageVisible } from "@/hooks/usePageVisible";

export function usePriceHistory(days = 7) {
  const [data, setData] = useState<PricePoint[]>([]);
  const visible = usePageVisible();
  const visibleRef = useRef(true);
  visibleRef.current = visible;

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!visibleRef.current) return;
      if (shouldSkip("priceHistory")) return;
      try {
        const result = await fetchDRBPriceHistory(days);
        onSuccess("priceHistory");
        if (mounted) setData(result);
      } catch {
        onFailure("priceHistory");
      }
    };

    fetchData();
    const timer = setInterval(fetchData, POLLING.PRICE_HISTORY_MS);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [days]);

  return data;
}
