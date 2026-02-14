"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getLevel, formatUSD, formatTokenAmount } from "@/lib/game";
import { DRB_TOTAL_SUPPLY } from "@/lib/constants";

interface PriceSimulatorProps {
  currentDRBPrice: number;
  drbBalance: number;
  wethValueUSD: number;
  currentTotalValue: number;
}

const QUICK_PICKS = [2, 5, 10, 50, 100];

function formatMC(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function fmtMult(m: number): string {
  return m >= 10 ? `${m.toFixed(0)}x` : `${m.toFixed(1)}x`;
}

// --- PnL-style share image generator (1080x1080 square) ---
async function generateShareImage(opts: {
  multiplier: number;
  marketCap: number;
  grokWallet: number;
  grokLevel: string;
  userDRB?: number;
  userCurrentValue?: number;
  userSimValue?: number;
}): Promise<Blob | null> {
  await document.fonts.ready;

  return new Promise((resolve) => {
    const S = 1080; // square
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);

    const GREEN = "#39FF14";
    const MONO = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace";
    const DISPLAY = "'Chakra Petch', 'SF Pro Display', sans-serif";
    const hasUser = !!(opts.userDRB && opts.userSimValue);

    // --- Background ---
    const bg = ctx.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, "#0d1a0d");
    bg.addColorStop(0.3, "#050505");
    bg.addColorStop(0.7, "#050505");
    bg.addColorStop(1, "#080812");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);

    // Subtle grid
    ctx.strokeStyle = "rgba(57, 255, 20, 0.02)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < S; gx += 36) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, S);
      ctx.stroke();
    }
    for (let gy = 0; gy < S; gy += 36) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(S, gy);
      ctx.stroke();
    }

    // Top accent bar
    const accentGrad = ctx.createLinearGradient(0, 0, S, 0);
    accentGrad.addColorStop(0, "transparent");
    accentGrad.addColorStop(0.2, GREEN);
    accentGrad.addColorStop(0.8, GREEN);
    accentGrad.addColorStop(1, "transparent");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(0, 0, S, 4);

    // Top radial glow
    const topGlow = ctx.createRadialGradient(S / 2, 0, 0, S / 2, 0, 400);
    topGlow.addColorStop(0, "rgba(57, 255, 20, 0.08)");
    topGlow.addColorStop(1, "transparent");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, S, 400);

    // Divider gradient
    const divGrad = ctx.createLinearGradient(80, 0, S - 80, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.5, "rgba(57, 255, 20, 0.12)");
    divGrad.addColorStop(1, "transparent");

    let y = 80;

    // GROKVAULT
    ctx.textAlign = "center";
    ctx.font = `bold 44px ${DISPLAY}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("GROKVAULT", S / 2, y);
    y += 36;

    // Subtitle
    ctx.font = `500 15px ${MONO}`;
    ctx.fillStyle = "rgba(57, 255, 20, 0.45)";
    ctx.fillText("WHAT IF SCENARIO", S / 2, y);
    y += 70;

    // Big multiplier with glow — position accounts for ascender
    const multFontSize = hasUser ? 130 : 150;
    ctx.font = `bold ${multFontSize}px ${DISPLAY}`;
    ctx.fillStyle = GREEN;
    ctx.shadowColor = "rgba(57, 255, 20, 0.5)";
    ctx.shadowBlur = 60;
    const multText = fmtMult(opts.multiplier);
    y += multFontSize * 0.72; // ascender offset
    ctx.fillText(multText, S / 2, y);
    ctx.shadowBlur = 0;
    y += multFontSize * 0.15 + 30; // descender + gap

    // Divider
    ctx.fillStyle = divGrad;
    ctx.fillRect(80, y, S - 160, 1);
    y += 50;

    // Stat row helper
    const drawStat = (
      label: string,
      value: string,
      color: string,
      large = false,
    ) => {
      ctx.textAlign = "left";
      ctx.font = `500 16px ${MONO}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.fillText(label, 100, y);
      ctx.textAlign = "right";
      ctx.font = `bold ${large ? 38 : 28}px ${DISPLAY}`;
      ctx.fillStyle = color;
      ctx.fillText(value, S - 100, y + (large ? 2 : 0));
      y += large ? 60 : 48;
    };

    drawStat("market cap", formatMC(opts.marketCap), GREEN, true);
    drawStat(
      "grok wallet",
      formatUSD(opts.grokWallet),
      "rgba(255,255,255,0.85)",
    );
    drawStat("level", opts.grokLevel, "rgba(255,255,255,0.5)");

    // User holdings (optional)
    if (hasUser) {
      y += 10;
      ctx.fillStyle = divGrad;
      ctx.fillRect(80, y, S - 160, 1);
      y += 42;

      ctx.textAlign = "left";
      ctx.font = `500 14px ${MONO}`;
      ctx.fillStyle = "rgba(57, 255, 20, 0.4)";
      ctx.fillText("YOUR HOLDINGS", 100, y);
      y += 45;

      drawStat(
        `${formatTokenAmount(opts.userDRB!)} DRB`,
        formatUSD(opts.userSimValue!),
        GREEN,
        true,
      );

      if (opts.userCurrentValue) {
        y -= 18;
        ctx.textAlign = "right";
        ctx.font = `400 14px ${MONO}`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fillText(
          `currently ${formatUSD(opts.userCurrentValue)}`,
          S - 100,
          y,
        );
      }
    }

    // Bottom watermark
    const bottomY = S - 60;
    ctx.fillStyle = divGrad;
    ctx.fillRect(80, bottomY - 25, S - 160, 1);
    ctx.textAlign = "center";
    ctx.font = `400 14px ${MONO}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillText(
      "grokvault.vercel.app  \u00B7  $DRB on Base",
      S / 2,
      bottomY + 15,
    );

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export function PriceSimulator({
  currentDRBPrice,
  drbBalance,
  wethValueUSD,
}: PriceSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [sliderPos, setSliderPos] = useState(0); // 0 = 1x
  const [userDRB, setUserDRB] = useState("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up blob URL when it changes or on unmount
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== previewUrl) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close modal on ESC key + focus trap
  useEffect(() => {
    if (!previewUrl) return;

    // Focus first button in modal
    const timer = setTimeout(() => {
      const firstBtn = modalRef.current?.querySelector<HTMLElement>("button, a");
      firstBtn?.focus();
    }, 100);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        triggerRef.current?.focus();
        return;
      }
      // Trap Tab within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [previewUrl]);

  // 1x → 100x log scale: 100^pos
  const simMultiplier = Math.pow(100, sliderPos);

  const currentMC = currentDRBPrice * DRB_TOTAL_SUPPLY;
  const simMC = currentMC * simMultiplier;
  const simPrice = currentDRBPrice * simMultiplier;

  const simDRBValue = drbBalance * simPrice;
  const simGrokTotal = wethValueUSD + simDRBValue;
  const simGrokLevel = useMemo(() => getLevel(simGrokTotal), [simGrokTotal]);

  const userAmount = parseFloat(userDRB) || 0;
  const userCurrentValue = userAmount * currentDRBPrice;
  const userSimValue = userAmount * simPrice;

  const tweetText = encodeURIComponent(
    `what if $DRB does a ${fmtMult(simMultiplier)}?\n\nmarket cap: ${formatMC(simMC)}\ngrok's wallet: ${formatUSD(simGrokTotal)}${userAmount > 0 ? `\nmy ${formatTokenAmount(userAmount)} DRB: ${formatUSD(userSimValue)}` : ""}\n\ntrack it: grokvault.vercel.app\n\n$DRB on Base`,
  );

  const imageOpts = useMemo(
    () => ({
      multiplier: simMultiplier,
      marketCap: simMC,
      grokWallet: simGrokTotal,
      grokLevel: `lvl ${simGrokLevel.level}: ${simGrokLevel.name}`,
      ...(userAmount > 0
        ? { userDRB: userAmount, userCurrentValue, userSimValue }
        : {}),
    }),
    [
      simMultiplier,
      simMC,
      simGrokTotal,
      simGrokLevel.level,
      simGrokLevel.name,
      userAmount,
      userCurrentValue,
      userSimValue,
    ],
  );

  // Create image → show popup preview
  const handleCreateImage = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await generateShareImage(imageOpts);
      if (blob) {
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } finally {
      setGenerating(false);
    }
  }, [imageOpts]);

  // Download from preview
  const handleDownloadFromPreview = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `grokvault-whatif-${fmtMult(simMultiplier).replace(".", "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [previewUrl, simMultiplier]);

  // Close preview
  const closePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    triggerRef.current?.focus();
  }, [previewUrl]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="group w-full text-left"
        >
          <div
            className={`relative rounded-xl border px-6 py-5 transition-all duration-300 overflow-hidden ${
              open
                ? "border-[#FFB800]/30 bg-[#FFB800]/[0.06]"
                : "border-[#FFB800]/15 bg-[#FFB800]/[0.03] hover:border-[#FFB800]/25 hover:bg-[#FFB800]/[0.05]"
            }`}
            style={{
              boxShadow: open
                ? "0 0 30px rgba(255, 184, 0, 0.06), inset 0 1px 0 rgba(255, 184, 0, 0.08)"
                : "0 0 20px rgba(255, 184, 0, 0.03), inset 0 1px 0 rgba(255, 184, 0, 0.04)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="text-lg sm:text-xl font-mono text-[#FFB800]/50"
                  aria-hidden="true"
                >
                  {open ? ">" : "~"}
                </span>
                <div>
                  <span className="text-sm sm:text-base font-display font-bold text-white group-hover:text-white transition-colors">
                    what if $DRB does a...
                  </span>
                  <span className="block text-xs font-mono text-[#FFB800]/55 mt-0.5">
                    scenario simulator &middot; MC: {formatMC(currentMC)}
                  </span>
                </div>
              </div>
              <motion.span
                animate={{ rotate: open ? 90 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-mono text-[#FFB800]/60"
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
                    <span className="text-xs text-white/55 font-mono">
                      1x
                    </span>
                    <span className="text-base text-[#FFB800] font-mono font-bold tracking-wide">
                      {fmtMult(simMultiplier)}
                    </span>
                    <span className="text-xs text-white/55 font-mono">
                      100x
                    </span>
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
                <div className="flex gap-2 mb-6 flex-wrap">
                  {QUICK_PICKS.map((mult) => {
                    const isActive =
                      Math.abs(simMultiplier - mult) < mult * 0.05;
                    return (
                      <button
                        key={mult}
                        onClick={() =>
                          setSliderPos(Math.log(mult) / Math.log(100))
                        }
                        className={`text-xs font-mono px-3 py-1.5 rounded border transition-all duration-200 ${
                          isActive
                            ? "border-[#FFB800]/40 text-[#FFB800] bg-[#FFB800]/[0.06]"
                            : "border-white/10 text-white/55 hover:text-[#FFB800] hover:border-[#FFB800]/40 hover:bg-[#FFB800]/[0.04]"
                        }`}
                      >
                        {mult}x
                      </button>
                    );
                  })}
                </div>

                {/* Scenario results */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.15em] text-[#FFB800]/55 font-mono">
                    scenario at {fmtMult(simMultiplier)}
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/55 font-mono">
                      market cap
                    </span>
                    <span className="text-lg font-display font-bold text-[#FFB800]">
                      {formatMC(simMC)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-white/55 font-mono">
                      grok&apos;s wallet
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-display font-bold text-white/85">
                        {formatUSD(simGrokTotal)}
                      </span>
                      <span className="text-xs text-white/55 font-mono">
                        lvl {simGrokLevel.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/[0.06] my-5" />

                {/* Your Holdings */}
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-[#FFB800]/55 font-mono mb-3">
                    your holdings
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="enter DRB amount"
                      value={userDRB}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                        const parts = cleaned.split(".");
                        setUserDRB(
                          parts.length > 2
                            ? parts[0] + "." + parts.slice(1).join("")
                            : cleaned
                        );
                      }}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white/80 placeholder:text-white/40 focus-visible:border-[#FFB800]/40 focus-visible:ring-2 focus-visible:ring-[#FFB800]/20 transition-colors outline-none"
                    />
                    <span className="text-xs text-white/55 font-mono">DRB</span>
                  </div>

                  {userAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-baseline"
                    >
                      <span className="text-xs text-white/55 font-mono">
                        {formatTokenAmount(userAmount)} DRB
                      </span>
                      <div className="text-right">
                        <span className="text-xs text-white/55 font-mono">
                          now {formatUSD(userCurrentValue)}
                        </span>
                        <span className="text-white/40 mx-1.5 font-mono">
                          &rarr;
                        </span>
                        <span className="text-sm font-display font-bold text-[#39FF14]">
                          {formatUSD(userSimValue)}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Share actions */}
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    ref={triggerRef}
                    onClick={handleCreateImage}
                    disabled={generating}
                    className="text-xs font-mono text-[#FFB800]/60 hover:text-[#FFB800] border border-[#FFB800]/20 hover:border-[#FFB800]/40 rounded px-4 py-2 transition-all uppercase tracking-wider"
                  >
                    {generating ? "creating..." : "[ create image ]"}
                  </button>
                  <span className="text-white/30 font-mono text-xs">
                    &middot;
                  </span>
                  <a
                    href={`https://x.com/intent/tweet?text=${tweetText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#FFB800]/60 hover:text-[#FFB800] border border-[#FFB800]/20 hover:border-[#FFB800]/40 rounded px-4 py-2 transition-all uppercase tracking-wider"
                  >
                    [ share on X ]
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={closePreview}
            role="dialog"
            aria-modal="true"
            aria-label="What If scenario image preview"
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closePreview}
                className="absolute -top-10 right-0 text-xs font-mono text-white/55 hover:text-white/80 transition-colors"
              >
                [esc]
              </button>

              {/* Image */}
              <div className="rounded-lg overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/50">
                <img
                  src={previewUrl}
                  alt="GrokVault scenario card"
                  className="w-full h-auto block"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handleDownloadFromPreview}
                  className="text-xs font-mono text-[#FFB800]/60 hover:text-[#FFB800] border border-[#FFB800]/20 hover:border-[#FFB800]/40 rounded px-4 py-2 transition-all uppercase tracking-wider"
                >
                  [ download ]
                </button>
                <a
                  href={`https://x.com/intent/tweet?text=${tweetText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownloadFromPreview}
                  className="text-xs font-mono text-[#FFB800]/60 hover:text-[#FFB800] border border-[#FFB800]/20 hover:border-[#FFB800]/40 rounded px-4 py-2 transition-all uppercase tracking-wider"
                >
                  [ share on X ]
                </a>
              </div>

              <p className="text-center text-xs text-white/55 font-mono mt-3">
                attach the downloaded image to your tweet
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
