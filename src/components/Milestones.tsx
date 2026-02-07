"use client";

import { motion } from "framer-motion";
import type { Milestone } from "@/lib/game";

interface MilestonesProps {
  milestones: Milestone[];
}

export function Milestones({ milestones }: MilestonesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {milestones.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className={`rounded px-3 py-1.5 border text-xs font-mono transition-all ${
            m.achieved ? "badge-achieved" : "badge-locked"
          }`}
        >
          <span className={m.achieved ? "text-[#39FF14]" : "text-white/40"}>
            {m.label}
          </span>
          {m.achieved && (
            <span className="ml-1.5 text-[#39FF14]/60">&check;</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
