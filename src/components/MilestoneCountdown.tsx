"use client";

import { formatUSD } from "@/lib/game";
import type { Level } from "@/lib/game";

interface MilestoneCountdownProps {
  currentValue: number;
  nextLevel: Level | null;
  dailyFeeRate: number;
}

export function MilestoneCountdown({
  currentValue,
  nextLevel,
  dailyFeeRate,
}: MilestoneCountdownProps) {
  if (!nextLevel) return null;

  const remaining = nextLevel.minValue - currentValue;
  if (remaining <= 0) return null;

  const estimateDays = dailyFeeRate > 0 ? Math.ceil(remaining / dailyFeeRate) : null;

  return (
    <div className="text-[11px] text-white/35 font-mono mt-2">
      ~{formatUSD(remaining)} to {nextLevel.name}
      {estimateDays !== null && (
        <span className="text-white/25">
          {" "}
          · at current rate: ~{estimateDays} day{estimateDays !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
