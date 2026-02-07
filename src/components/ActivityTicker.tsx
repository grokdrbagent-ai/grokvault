"use client";

import { useMemo } from "react";
import { generateTickerEvents, TickerEvent } from "@/lib/tickerEvents";
import type { TokenTransfer } from "@/lib/api";

interface ActivityTickerProps {
  recentFees: TokenTransfer[];
  drbPrice: number;
  ethPrice: number;
  totalValueUSD: number;
}

const typeColors: Record<TickerEvent["type"], string> = {
  fee: "text-[#39FF14]/50",
  price: "text-[#00EAFF]/40",
  milestone: "text-[#FFB800]/50",
};

export function ActivityTicker({
  recentFees,
  drbPrice,
  ethPrice,
  totalValueUSD,
}: ActivityTickerProps) {
  const events = useMemo(
    () => generateTickerEvents(recentFees, drbPrice, ethPrice, totalValueUSD),
    [recentFees, drbPrice, ethPrice, totalValueUSD]
  );

  if (events.length === 0) return null;

  const content = events.map((e, i) => (
    <span key={e.id} className={typeColors[e.type]}>
      {e.text}
      {i < events.length - 1 && (
        <span className="text-white/10 mx-4">·</span>
      )}
    </span>
  ));

  return (
    <div className="ticker-container border-b border-white/[0.04] overflow-hidden">
      <div className="ticker-scroll text-[10px] font-mono whitespace-nowrap py-2">
        <span className="ticker-content">{content}</span>
        <span className="ticker-content ml-12" aria-hidden>{content}</span>
      </div>
    </div>
  );
}
