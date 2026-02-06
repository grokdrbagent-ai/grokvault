"use client";

import { motion } from "framer-motion";
import { useWalletData } from "@/hooks/useWalletData";
import { getLevel, getNextLevel, getProgress, getMilestones, formatUSD, formatTokenAmount } from "@/lib/game";
import { CounterAnimation } from "@/components/CounterAnimation";
import { ProgressBar } from "@/components/ProgressBar";
import { StatCard } from "@/components/StatCard";
import { Milestones } from "@/components/Milestones";
import { RecentFees } from "@/components/RecentFees";
import { ShareButton } from "@/components/ShareButton";
import { Footer } from "@/components/Footer";
import { LINKS } from "@/lib/constants";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">{"🏦"}</div>
        <div className="text-sm text-white/40 font-mono">Loading GrokVault...</div>
        <div className="mt-4 w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-[#0052FF] rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">{"⚠️"}</div>
        <div className="text-sm text-white/40 font-mono mb-2">Data unavailable</div>
        <div className="text-xs text-red-400/60 font-mono mb-4">{error}</div>
        <button
          onClick={onRetry}
          className="text-xs text-[#0052FF] hover:text-[#0052FF]/80 font-mono transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { data, loading, error, refetch } = useWalletData();

  if (loading) return <LoadingScreen />;
  if (error && !data) return <ErrorScreen error={error} onRetry={refetch} />;
  if (!data) return <LoadingScreen />;

  const level = getLevel(data.totalValueUSD);
  const nextLevel = getNextLevel(data.totalValueUSD);
  const progress = getProgress(data.totalValueUSD);
  const milestones = getMilestones(data.totalValueUSD);

  // Calculate daily earnings from recent fees (last 24h)
  const oneDayAgo = Date.now() / 1000 - 86400;
  const dailyFees = data.recentFees
    .filter(
      (f) =>
        f.to.toLowerCase() === "0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9" &&
        parseInt(f.timeStamp) > oneDayAgo
    )
    .reduce((sum, f) => sum + parseInt(f.value) / 1e18, 0);
  const dailyEarningsUSD = dailyFees * data.drbPrice;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{"🏦"}</span>
            <span className="font-bold text-lg tracking-tight">GROKVAULT</span>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton
              totalValue={data.totalValueUSD}
              level={level}
              dailyEarnings={dailyEarningsUSD}
            />
            <a
              href={LINKS.grokWallet}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              draco.base.eth <span className="text-[#0052FF]">{"🔵"}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Level & Total Value */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="text-xs uppercase tracking-widest text-white/30 mb-3">
            {"Grok's Wallet"}
          </div>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0052FF]/10 border border-[#0052FF]/20 px-4 py-1.5 mb-4">
            <span className="text-lg level-pulse">{level.emoji}</span>
            <span className="text-sm font-semibold text-[#0052FF]">
              Level {level.level}: {level.name}
            </span>
          </div>

          {/* Total Value */}
          <div className="mb-2">
            <CounterAnimation
              value={data.totalValueUSD}
              prefix="$"
              decimals={0}
              className="text-5xl sm:text-6xl font-bold tracking-tight"
            />
          </div>

          {/* Daily change indicator */}
          {dailyEarningsUSD > 0 && (
            <div className="text-sm text-[#00FF88] font-mono">
              +{formatUSD(dailyEarningsUSD)} today from swap fees
            </div>
          )}
        </motion.section>

        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="ETH Balance"
            value={`${data.ethBalance.toFixed(2)} ETH`}
            subValue={formatUSD(data.ethValueUSD)}
            delay={0.1}
          />
          <StatCard
            label="$DRB Balance"
            value={`${formatTokenAmount(data.drbBalance)} DRB`}
            subValue={formatUSD(data.drbValueUSD)}
            delay={0.2}
          />
          <StatCard
            label="Daily Earnings"
            value={formatUSD(dailyEarningsUSD)}
            subValue={`${formatTokenAmount(dailyFees)} DRB`}
            icon={"\u2191"}
            delay={0.3}
          />
        </section>

        {/* Progress to Next Level */}
        {nextLevel && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40 uppercase tracking-wider">
                Next: {nextLevel.name} {nextLevel.emoji}
              </span>
              <span className="text-xs text-white/40 font-mono">
                {formatUSD(nextLevel.minValue)} &middot; {progress.toFixed(1)}%
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
          className="mb-10"
        >
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">
            Achievements
          </h2>
          <Milestones milestones={milestones} />
        </motion.section>

        {/* Recent Fees */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-10"
        >
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">
            Recent Fees
          </h2>
          <RecentFees fees={data.recentFees} drbPrice={data.drbPrice} />
        </motion.section>

        {/* Last updated */}
        <div className="text-center text-[10px] text-white/20 font-mono">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()} &middot; Auto-refreshes every 60s
        </div>

        <Footer />
      </main>
    </div>
  );
}
