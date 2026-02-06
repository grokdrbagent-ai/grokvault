"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchAllWalletData, WalletData } from "@/lib/api";
import { REFRESH_INTERVAL } from "@/lib/constants";

interface UseWalletDataReturn {
  data: WalletData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWalletData(): UseWalletDataReturn {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      const walletData = await fetchAllWalletData();
      setData(walletData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refetch]);

  return { data, loading, error, refetch };
}
