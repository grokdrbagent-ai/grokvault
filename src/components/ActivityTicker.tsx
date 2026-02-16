"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { generateTickerEvents, TickerEvent } from "@/lib/tickerEvents";
import type { TokenTransfer } from "@/lib/api";

interface ActivityTickerProps {
  recentFees: TokenTransfer[];
  drbPrice: number;
  ethPrice: number;
  totalValueUSD: number;
}

const typeColors: Record<TickerEvent["type"], string> = {
  fee: "text-[#39FF14]/60",
  price: "text-[#00EAFF]/50",
  milestone: "text-[#FFB800]/60",
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

  const measureRef = useRef<HTMLSpanElement>(null);
  const [copies, setCopies] = useState(10);

  const calcCopies = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    const oneSetWidth = el.scrollWidth;
    if (oneSetWidth === 0) return;
    // Need at least 2x viewport covered so scrolling 50% is seamless
    const needed = Math.ceil((window.innerWidth * 2) / oneSetWidth) + 1;
    setCopies(Math.max(needed, 4));
  }, []);

  useEffect(() => {
    calcCopies();
    window.addEventListener("resize", calcCopies);
    return () => window.removeEventListener("resize", calcCopies);
  }, [calcCopies, events]);

  if (events.length === 0) return null;

  const separator = <span className="text-white/40 mx-4">&middot;</span>;

  const oneSet = events.map((e, i) => (
    <span key={e.id} className={typeColors[e.type]}>
      {e.text}
      {i < events.length - 1 && (
        <span className="text-white/40 mx-4">&middot;</span>
      )}
    </span>
  ));

  return (
    <div className="ticker-container border-b border-white/[0.04] overflow-hidden">
      <div className="ticker-scroll text-xs font-mono whitespace-nowrap py-2">
        {/* Hidden measurer for one set */}
        <span
          ref={measureRef}
          className="ticker-content"
          style={{ position: "absolute", visibility: "hidden" }}
        >
          {oneSet}{separator}
        </span>
        {/* Visible copies */}
        {Array.from({ length: copies }, (_, i) => (
          <span key={i} className="ticker-content" aria-hidden={i > 0 || undefined}>
            {oneSet}{separator}
          </span>
        ))}
      </div>
    </div>
  );
}
