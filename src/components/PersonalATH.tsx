"use client";

import { formatUSD } from "@/lib/game";

interface PersonalATHProps {
  ath: { value: number; timestamp: number } | null;
  isNewATH: boolean;
}

export function PersonalATH({ ath, isNewATH }: PersonalATHProps) {
  if (!ath) return null;

  const dateStr = new Date(ath.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`text-xs font-mono mt-2 ${
        isNewATH ? "text-[#00EAFF]/70 ath-glow" : "text-white/55"
      }`}
    >
      {isNewATH ? "new ATH!" : "witnessed ATH"}: {formatUSD(ath.value)} — {dateStr}
    </div>
  );
}
