"use client";

import { motion } from "framer-motion";
import type { Milestone } from "@/lib/game";

interface MilestonesProps {
  milestones: Milestone[];
}

export function Milestones({ milestones }: MilestonesProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {milestones.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center transition-all ${
            m.achieved
              ? "bg-[#FFD700]/10 border border-[#FFD700]/30 shadow-[0_0_12px_rgba(255,215,0,0.15)]"
              : "bg-white/[0.02] border border-white/5 opacity-40"
          }`}
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs font-mono text-white/70">{m.label}</span>
          <span className="text-[10px]">{m.achieved ? "\u2705" : "\u23F3"}</span>
        </motion.div>
      ))}
    </div>
  );
}
