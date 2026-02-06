"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  return (
    <div className={`w-full progress-track rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full progress-fill"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
  );
}
