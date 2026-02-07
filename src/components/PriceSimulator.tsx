"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLevel, getMilestones, getProgress, formatUSD } from "@/lib/game";

interface PriceSimulatorProps {
  currentDRBPrice: number;
  drbBalance: number;
  wethValueUSD: number;
  currentTotalValue: number;
}

const QUICK_PICKS = [2, 5, 10, 50, 100];

export function PriceSimulator({
  currentDRBPrice,
  drbBalance,
  wethValueUSD,
  currentTotalValue,
}: PriceSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [sliderPos, setSliderPos] = useState(0.5);

  const minMultiplier = 0.1;
  const maxMultiplier = 100;

  const simMultiplier = minMultiplier * Math.pow(maxMultiplier / minMultiplier, sliderPos);
  const simPrice = currentDRBPrice * simMultiplier;
  const simDRBValue = drbBalance * simPrice;
  const simTotal = wethValueUSD + simDRBValue;

  const simLevel = useMemo(() => getLevel(simTotal), [simTotal]);
  const simMilestones = useMemo(() => getMilestones(simTotal), [simTotal]);
  const simProgress = useMemo(() => getProgress(simTotal), [simTotal]);
  const percentChange = ((simTotal - currentTotalValue) / currentTotalValue) * 100;
  const achievedCount = simMilestones.filter((m) => m.achieved).length;

  const tweetText = encodeURIComponent(
    `what if $DRB hits $${simPrice.toFixed(8)}?\n\ngrok's wallet would be worth ${formatUSD(simTotal)}\nlvl ${simLevel.level}: ${simLevel.name}\n\ntrack it: grokvault.vercel.app\n\n$DRB on Base`
  );

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="mb-12"
    >
      {/* Trigger — visible card-like element */}
      <button
        onClick={() => setOpen(!open)}
        className="group w-full text-left"
      >
        <div
          className={`rounded-lg border px-4 py-3 transition-all duration-300 ${
            open
              ? "border-[#39FF14]/20 bg-[#39FF14]/[0.03]"
              : "border-white/[0.06] bg-white/[0.01] hover:border-[#39FF14]/15 hover:bg-[#39FF14]/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base sm:text-lg font-mono text-white/30" aria-hidden="true">
                {open ? ">" : "~"}
              </span>
              <div>
                <span className="text-xs sm:text-sm font-display font-semibold text-white/70 group-hover:text-white/90 transition-colors">
                  what if $DRB hits...
                </span>
                <span className="block text-[10px] font-mono text-white/30 mt-0.5">
                  price simulator &middot; drag to explore
                </span>
              </div>
            </div>
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-mono text-[#39FF14]/50"
            >
              {open ? "[-]" : "[+]"}
            </motion.span>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="card-glow rounded-lg p-5 mt-2">
              {/* Slider */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-white/40 font-mono">0.1x</span>
                  <span className="text-sm text-[#39FF14] font-mono font-bold tracking-wide">
                    {simMultiplier.toFixed(1)}x &middot; ${simPrice.toFixed(8)}
                  </span>
                  <span className="text-[11px] text-white/40 font-mono">100x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(parseFloat(e.target.value))}
                  className="sim-slider w-full"
                />
              </div>

              {/* Quick picks */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {QUICK_PICKS.map((mult) => (
                  <button
                    key={mult}
                    onClick={() =>
                      setSliderPos(
                        Math.log(mult / minMultiplier) /
                          Math.log(maxMultiplier / minMultiplier)
                      )
                    }
                    className="text-[11px] font-mono px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-[#39FF14] hover:border-[#39FF14]/40 hover:bg-[#39FF14]/[0.04] transition-all duration-200"
                  >
                    {mult}x
                  </button>
                ))}
              </div>

              {/* Projected results */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] text-white/35 font-mono">projected value</span>
                  <span className="text-lg font-display font-bold text-[#39FF14]">
                    {formatUSD(simTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/35 font-mono">change</span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      percentChange >= 0 ? "text-[#39FF14]/80" : "text-[#FF2D55]/80"
                    }`}
                  >
                    {percentChange >= 0 ? "+" : ""}
                    {percentChange.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/35 font-mono">level</span>
                  <span className="text-xs font-display text-white/60">
                    lvl {simLevel.level}: {simLevel.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-white/35 font-mono">milestones</span>
                  <span className="text-xs text-white/50 font-mono">
                    {achievedCount}/{simMilestones.length} &middot; {simProgress.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Share */}
              <a
                href={`https://x.com/intent/tweet?text=${tweetText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 block text-center text-[11px] font-mono text-white/30 hover:text-[#39FF14]/70 transition-colors uppercase tracking-wider py-2"
              >
                [ share scenario on X ]
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
