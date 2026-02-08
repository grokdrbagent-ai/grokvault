"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon?: string;
  delay?: number;
  accent?: "green" | "cyan" | "amber";
}

const accentColors = {
  green: "text-[#39FF14]/50",
  cyan: "text-[#00EAFF]/50",
  amber: "text-[#FFB800]/50",
};

export function StatCard({ label, value, subValue, delay = 0, accent }: StatCardProps) {
  const labelColor = accent ? accentColors[accent] : "text-white/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card-glow rounded-lg px-5 py-4"
    >
      <div className={`text-[11px] uppercase tracking-[0.2em] mb-3 font-display ${labelColor}`}>
        {label}
      </div>
      <div className="text-lg font-semibold font-display tracking-tight text-white">
        {value}
      </div>
      <div className="text-xs text-white/45 mt-1">
        {subValue}
      </div>
    </motion.div>
  );
}
