"use client";

import { motion } from "framer-motion";
import { useWalletData } from "@/hooks/useWalletData";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import {
  getLevel,
  getNextLevel,
  getProgress,
  getMilestones,
  formatUSD,
  formatTokenAmount,
} from "@/lib/game";
import { CounterAnimation } from "@/components/CounterAnimation";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { Milestones } from "@/components/Milestones";
import { ShareButton } from "@/components/ShareButton";
import { SparklineChart } from "@/components/SparklineChart";
import { CoinRain } from "@/components/CoinRain";
import { Footer } from "@/components/Footer";
import { LINKS } from "@/lib/constants";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="live-dot mx-auto mb-4 w-3 h-3" />
        <div className="text-xs text-white/30 font-mono tracking-widest uppercase">
          initializing grokvault...
        </div>
        <div className="mt-4 w-48 h-0.5 progress-track rounded-full overflow-hidden mx-auto">
          <div
            className="h-full progress-fill rounded-full animate-pulse"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-3 h-3 rounded-full bg-[#FF2D55] mx-auto mb-4 animate-pulse" />
        <div className="text-xs text-white/30 font-mono tracking-widest uppercase mb-2">
          connection lost
        </div>
        <div className="text-[10px] text-[#FF2D55]/60 font-mono mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-[10px] text-[#39FF14]/60 hover:text-[#39FF14] font-mono transition-colors uppercase tracking-wider"
        >
          [ retry ]
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { data, loading, error, newFeeCount } = useWalletData();
  const priceHistory = usePriceHistory(7);

  if (loading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen error={error} />;
  if (!data) return <LoadingScreen />;

  const level = getLevel(data.totalValueUSD);
  const nextLevel = getNextLevel(data.totalValueUSD);
  const progress = getProgress(data.totalValueUSD);
  const milestones = getMilestones(data.totalValueUSD);

  const earningsUSD = data.recentFees.reduce((sum, f) => {
    const amount = parseFloat(f.value);
    const price = f.token === "DRB" ? data.drbPrice : data.ethPrice;
    return sum + amount * price;
  }, 0);

  return (
    <div className="relative min-h-screen text-white z-10">
      <CoinRain trigger={newFeeCount} />

      {/* Header */}
      <header className="border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="live-dot" />
            <span className="font-display font-bold text-base tracking-tight">
              GROKVAULT
            </span>
            <span className="text-[9px] text-white/15 font-mono uppercase tracking-widest hidden sm:inline">
              live
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ShareButton
              totalValue={data.totalValueUSD}
              level={level}
              dailyEarnings={earningsUSD}
            />
            <a
              href={LINKS.grokWallet}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-[10px] text-white/20 hover:text-white/40 transition-colors font-mono"
            >
              basescan
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero: Net Worth */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 mb-4 font-mono">
            net worth
          </div>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#39FF14]/15 bg-[#39FF14]/[0.03] px-4 py-1.5 mb-5">
            <span className="text-[10px] font-mono text-[#39FF14]/70 uppercase tracking-wider">
              lvl {level.level}
            </span>
            <span className="w-px h-3 bg-[#39FF14]/20" />
            <span className="text-[10px] font-display font-semibold text-[#39FF14]">
              {level.name}
            </span>
          </div>

          {/* Total Value */}
          <div className="mb-3 flex items-baseline justify-center gap-3 flex-wrap">
            <CounterAnimation
              value={data.totalValueUSD}
              prefix="$"
              decimals={0}
              className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight value-glow"
            />
            <span
              className={`text-xs font-mono ${
                data.change24hPercent >= 0
                  ? "text-[#39FF14]/70"
                  : "text-[#FF2D55]/70"
              }`}
            >
              {data.change24hPercent >= 0 ? "\u25B2" : "\u25BC"}{" "}
              {data.change24hPercent >= 0 ? "+" : ""}
              {data.change24hPercent.toFixed(1)}%
              <span className="text-white/20 ml-1">24h</span>
            </span>
          </div>

          {/* Fee earnings */}
          {earningsUSD > 0 && (
            <div className="text-[11px] text-[#39FF14]/40 font-mono">
              +{formatUSD(earningsUSD)} fee income (7d)
            </div>
          )}
        </motion.section>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          <StatCard
            label="WETH"
            value={`${data.wethBalance.toFixed(2)} WETH`}
            subValue={formatUSD(data.wethValueUSD)}
            delay={0.1}
          />
          <StatCard
            label="$DRB"
            value={`${formatTokenAmount(data.drbBalance)} DRB`}
            subValue={formatUSD(data.drbValueUSD)}
            delay={0.2}
          />
          <StatCard
            label="7D fees"
            value={formatUSD(earningsUSD)}
            subValue={`${Math.floor(data.recentFees.length / 2)} claims`}
            delay={0.3}
          />
        </section>

        {/* Glow divider */}
        <div className="glow-divider mb-12" />

        {/* 7-Day Price Trend */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-mono">
              $DRB / 7d
            </h2>
            {priceHistory.length > 1 && (
              <span className="text-[10px] text-white/20 font-mono">
                ${data.drbPrice.toFixed(8)}
              </span>
            )}
          </div>
          <div className="card-glow rounded-lg p-4">
            <SparklineChart data={priceHistory} />
          </div>
        </motion.section>

        {/* Progress to Next Level */}
        {nextLevel && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/25 uppercase tracking-wider font-mono">
                next: {nextLevel.name}
              </span>
              <span className="text-[10px] text-white/25 font-mono">
                {formatUSD(nextLevel.minValue)} &middot;{" "}
                {progress.toFixed(1)}%
              </span>
            </div>
            <ProgressBar progress={progress} />
          </motion.section>
        )}

        {/* Milestones */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-mono mb-4">
            achievements
          </h2>
          <Milestones milestones={milestones} />
        </motion.section>

        {/* Last updated */}
        <div className="text-center text-[9px] text-white/10 font-mono tracking-wider">
          {new Date(data.lastUpdated).toLocaleTimeString()} &middot; 30s
          balances &middot; 60s prices
        </div>

        <Footer />
      </main>
    </div>
  );
}
