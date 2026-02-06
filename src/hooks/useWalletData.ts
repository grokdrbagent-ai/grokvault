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

const RPC_INTERVAL = 30_000; // 30s for balances + fees
const PRICE_INTERVAL = 60_000; // 60s for DexScreener prices

interface UseWalletDataReturn {
  data: WalletData | null;
  loading: boolean;
  error: string | null;
  newFeeCount: number; // increments when new fees detected
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

  // Fetch prices (slower interval)
  const fetchPriceData = useCallback(async () => {
    try {
      const { ethPrice, drbPrice } = await fetchPrices();
      pricesRef.current = { eth: ethPrice, drb: drbPrice };
    } catch {
      // Keep stale prices on error
    }
  }, []);

  // Fetch balances + fees (faster interval), combine with cached prices
  const fetchBalances = useCallback(async () => {
    try {
      setError(null);
      const [wethBalance, drbBalance, recentFees] = await Promise.all([
        fetchWETHBalance(),
        fetchDRBBalance(),
        fetchRecentFees(),
      ]);

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

      // Detect new fees
      const currentHashes = new Set(recentFees.map((f) => f.hash));
      if (prevFeeHashesRef.current.size > 0) {
        const hasNewFees = recentFees.some((f) => !prevFeeHashesRef.current.has(f.hash));
        if (hasNewFees) {
          setNewFeeCount((c) => c + 1);
        }
      }
      prevFeeHashesRef.current = currentHashes;

      setData({
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load: fetch prices first, then balances
    const init = async () => {
      await fetchPriceData();
      await fetchBalances();
    };
    init();

    const rpcTimer = setInterval(fetchBalances, RPC_INTERVAL);
    const priceTimer = setInterval(fetchPriceData, PRICE_INTERVAL);

    return () => {
      clearInterval(rpcTimer);
      clearInterval(priceTimer);
    };
  }, [fetchPriceData, fetchBalances]);

  return { data, loading, error, newFeeCount };
}
