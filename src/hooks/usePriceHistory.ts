"use client";

import { useState, useEffect } from "react";
import { fetchDRBPriceHistory, PricePoint } from "@/lib/api";

export function usePriceHistory(days = 7) {
  const [data, setData] = useState<PricePoint[]>([]);

  useEffect(() => {
    fetchDRBPriceHistory(days).then(setData);
    // Refresh historical data every 5 minutes
    const timer = setInterval(() => {
      fetchDRBPriceHistory(days).then(setData);
    }, 300_000);
    return () => clearInterval(timer);
  }, [days]);

  return data;
}
