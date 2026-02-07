"use client";

import { motion } from "framer-motion";
import type { StatusTone } from "@/hooks/useStatusMessage";

interface StatusMessageProps {
  message: string;
  tone: StatusTone;
}

const toneColors: Record<StatusTone, string> = {
  positive: "text-[#39FF14]/60",
  exciting: "text-[#FFB800]/70",
  negative: "text-[#FF2D55]/55",
  neutral: "text-white/40",
};

export function StatusMessage({ message, tone }: StatusMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`text-xs font-mono mb-4 ${toneColors[tone]}`}
    >
      {message}
    </motion.div>
  );
}
