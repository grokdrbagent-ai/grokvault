"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon?: string;
  delay?: number;
}

export function StatCard({ label, value, subValue, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
    >
      <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
      <div className="text-xl font-bold text-white font-mono">{value}</div>
      <div className="text-sm text-white/50 mt-1 font-mono">{subValue}</div>
    </motion.div>
  );
}
