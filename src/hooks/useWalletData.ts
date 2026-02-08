"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchWETHBalance,
  fetchDRBBalance,
  fetchPrices,
  fetchRecentFees,
  WalletData,
  PriceData,
} from "@/lib/api";

const BALANCE_INTERVAL = 30_000; // 30s for balances
const PRICE_INTERVAL = 60_000; // 60s for DexScreener prices
const FEE_INTERVAL = 60_000; // 60s for fee scanning

interface UseWalletDataReturn {
  data: WalletData | null;
  loading: boolean;
  error: string | null;
  newFeeCount: number;
}

export function useWalletData(): UseWalletDataReturn {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFeeCount, setNewFeeCount] = useState(0);

  const pricesRef = useRef<{ eth: PriceData; drb: PriceData }>({
    eth: { usd: 0, usd_24h_change: 0 },
    drb: { usd: 0, usd_24h_change: 0 },
  });
  const prevFeeHashesRef = useRef<Set<string>>(new Set());

  // Rebuild data object from prices + balances + existing fees
  const buildData = useCallback(
    (wethBalance: number, drbBalance: number, recentFees: WalletData["recentFees"]) => {
      const ethPrice = pricesRef.current.eth.usd;
      const drbPrice = pricesRef.current.drb.usd;
      const wethValueUSD = wethBalance * ethPrice;
      const drbValueUSD = drbBalance * drbPrice;
      const totalValueUSD = wethValueUSD + drbValueUSD;

      const ethWeight = totalValueUSD > 0 ? wethValueUSD / totalValueUSD : 0.5;
      const drbWeight = totalValueUSD > 0 ? drbValueUSD / totalValueUSD : 0.5;
      const change24hPercent =
        pricesRef.current.eth.usd_24h_change * ethWeight +
        pricesRef.current.drb.usd_24h_change * drbWeight;

      return {
        wethBalance,
        drbBalance,
        ethPrice,
        drbPrice,
        totalValueUSD,
        wethValueUSD,
        drbValueUSD,
        change24hPercent,
        recentFees,
        lastUpdated: Date.now(),
      };
    },
    [],
  );

  // Fetch fees (background, non-blocking)
  const fetchFees = useCallback(async () => {
    try {
      const recentFees = await fetchRecentFees();

      // Detect new fees
      const currentHashes = new Set(recentFees.map((f) => f.hash));
      if (prevFeeHashesRef.current.size > 0) {
        const hasNewFees = recentFees.some((f) => !prevFeeHashesRef.current.has(f.hash));
        if (hasNewFees) setNewFeeCount((c) => c + 1);
      }
      prevFeeHashesRef.current = currentHashes;

      // Merge fees into existing data
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, recentFees, lastUpdated: Date.now() };
      });
    } catch {
      // Fees are non-critical, silently ignore
    }
  }, []);

  // Fetch prices + balances together (critical path)
  const fetchCoreData = useCallback(async () => {
    try {
      setError(null);

      // All critical fetches in parallel
      const [prices, wethBalance, drbBalance] = await Promise.all([
        fetchPrices(),
        fetchWETHBalance(),
        fetchDRBBalance(),
      ]);

      pricesRef.current = { eth: prices.ethPrice, drb: prices.drbPrice };

      setData((prev) =>
        buildData(wethBalance, drbBalance, prev?.recentFees ?? []),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [buildData]);

  useEffect(() => {
    // Phase 1: prices + balances in parallel (~2-3s) → show dashboard
    // Phase 2: fees in background (~5-10s) → update when ready
    fetchCoreData();
    fetchFees();

    const balanceTimer = setInterval(fetchCoreData, BALANCE_INTERVAL);
    const feeTimer = setInterval(fetchFees, FEE_INTERVAL);

    return () => {
      clearInterval(balanceTimer);
      clearInterval(feeTimer);
    };
  }, [fetchCoreData, fetchFees]);

  return { data, loading, error, newFeeCount };
}
