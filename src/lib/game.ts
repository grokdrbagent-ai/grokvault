import { LEVELS, MILESTONES } from "./constants";

export type Level = (typeof LEVELS)[number];
export type Milestone = (typeof MILESTONES)[number] & { achieved: boolean };

export function getLevel(totalValueUSD: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalValueUSD >= LEVELS[i].minValue) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(totalValueUSD: number): Level | null {
  const current = getLevel(totalValueUSD);
  const currentIndex = LEVELS.findIndex((l) => l.level === current.level);
  return LEVELS[currentIndex + 1] ?? null;
}

export function getProgress(totalValueUSD: number): number {
  const current = getLevel(totalValueUSD);
  const next = getNextLevel(totalValueUSD);
  if (!next) return 100;
  const progress = ((totalValueUSD - current.minValue) / (next.minValue - current.minValue)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export function getMilestones(totalValueUSD: number): Milestone[] {
  return MILESTONES.map((m) => ({
    ...m,
    achieved: totalValueUSD >= m.value,
  }));
}

export function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `$${value.toFixed(2)}`;
}

export function formatTokenAmount(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function generateTweetText(
  totalValue: string,
  level: Level,
  dailyEarnings: string
): string {
  return `grok's wallet just hit ${totalValue} \u{1F3E6}

level ${level.level}: ${level.name} ${level.emoji}
earning ${dailyEarnings} per day in swap fees

track it live \u2192 grokvault.vercel.app

$DRB \u{1F3A9}\u{1F535}`;
}
