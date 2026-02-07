"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getRandomComparison } from "@/lib/comparisons";

interface FunComparisonProps {
  currentValue: number;
}

export function FunComparison({ currentValue }: FunComparisonProps) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      setText(getRandomComparison(currentValue));
    };
    update();
    const interval = setInterval(update, 5_000);
    return () => clearInterval(interval);
  }, [currentValue]);

  if (!text) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <span className="hidden sm:block w-8 h-px bg-gradient-to-r from-transparent to-[#39FF14]/20" />

      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-[13px] sm:text-sm text-[#39FF14]/60 font-mono tracking-wide"
        >
          {text}
        </motion.div>
      </AnimatePresence>

      <span className="hidden sm:block w-8 h-px bg-gradient-to-l from-transparent to-[#39FF14]/20" />
    </div>
  );
}
