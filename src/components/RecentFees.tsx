"use client";

import { motion } from "framer-motion";
import { TokenTransfer } from "@/lib/api";
import { formatTokenAmount, timeAgo } from "@/lib/game";

interface RecentFeesProps {
  fees: TokenTransfer[];
  drbPrice: number;
}

export function RecentFees({ fees, drbPrice }: RecentFeesProps) {
  // Only show incoming transfers (to the Grok wallet)
  const incomingFees = fees
    .filter((f) => f.to.toLowerCase() === "0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9")
    .slice(0, 10);

  if (incomingFees.length === 0) {
    return (
      <div className="text-white/30 text-sm font-mono text-center py-4">
        No recent fees found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {incomingFees.map((fee, i) => {
        const amount = parseInt(fee.value) / 1e18;
        const usdValue = amount * drbPrice;
        return (
          <motion.div
            key={fee.hash}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-[#00FF88] text-sm">+</span>
              <div>
                <span className="text-sm font-mono text-white">
                  {formatTokenAmount(amount)} DRB
                </span>
                <span className="text-xs text-white/30 ml-2">
                  (${usdValue.toFixed(0)})
                </span>
              </div>
            </div>
            <span className="text-xs text-white/30 font-mono">
              {timeAgo(parseInt(fee.timeStamp))}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
