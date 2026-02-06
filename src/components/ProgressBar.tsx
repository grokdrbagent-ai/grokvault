"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full rounded-full bg-white/5 h-4 overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#0052FF] to-[#00FF88]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
}
