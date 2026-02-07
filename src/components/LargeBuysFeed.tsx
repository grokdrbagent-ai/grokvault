"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatUSD, formatTokenAmount, timeAgo } from "@/lib/game";
import type { LargeBuy } from "@/lib/swapScanner";

interface LargeBuysFeedProps {
  buys: LargeBuy[];
  loading: boolean;
}

function shortenAddress(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function LargeBuysFeed({ buys, loading }: LargeBuysFeedProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45 }}
      className="mb-12"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="live-dot" />
        <h2 className="text-xs uppercase tracking-[0.15em] text-white/50 font-display font-semibold">
          large buys
        </h2>
        <span className="text-[11px] text-white/35 font-mono">
          $10K+ &middot; 7d
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-white/35 font-mono">
          {buys.length} detected
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : buys.length === 0 ? (
        <div className="rounded-lg border border-white/[0.04] bg-white/[0.01] py-8 text-center">
          <div className="text-xs text-white/35 font-mono">
            no large buys detected in the last 7d
          </div>
          <div className="text-[11px] text-white/25 font-mono mt-1">
            watching for $10K+ swaps
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {buys.slice(0, 10).map((buy, index) => {
              const isRecent = Date.now() / 1000 - buy.timestamp < 300;
              return (
                <motion.div
                  key={buy.hash}
                  initial={{ opacity: 0, x: -30, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: index * 0.03,
                  }}
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors ${
                    isRecent
                      ? "bg-[#39FF14]/[0.04] border border-[#39FF14]/10"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Live dot */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isRecent ? "live-dot" : "bg-[#39FF14]/25"
                    }`}
                  />

                  {/* USD value */}
                  <span
                    className={`text-sm font-display font-bold min-w-[80px] ${
                      isRecent ? "text-[#39FF14]" : "text-[#39FF14]/80"
                    }`}
                  >
                    {formatUSD(buy.usdValue)}
                  </span>

                  {/* DRB amount */}
                  <span className="text-[11px] text-white/50 font-mono">
                    {formatTokenAmount(buy.drbAmount)} DRB
                  </span>

                  {/* Spacer */}
                  <span className="flex-1" />

                  {/* Address — clickable to Basescan */}
                  <a
                    href={`https://basescan.org/address/${buy.buyer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-white/35 hover:text-white/60 font-mono transition-colors"
                  >
                    {shortenAddress(buy.buyer)}
                  </a>

                  {/* Time ago */}
                  <span
                    className={`text-[11px] font-mono min-w-[40px] text-right ${
                      isRecent ? "text-[#39FF14]/50" : "text-white/35"
                    }`}
                  >
                    {timeAgo(buy.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.section>
  );
}
