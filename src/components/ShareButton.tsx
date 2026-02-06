"use client";

import { generateTweetText, formatUSD, type Level } from "@/lib/game";

interface ShareButtonProps {
  totalValue: number;
  level: Level;
  dailyEarnings: number;
}

export function ShareButton({ totalValue, level, dailyEarnings }: ShareButtonProps) {
  const tweetText = generateTweetText(
    formatUSD(totalValue),
    level,
    formatUSD(dailyEarnings)
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share
    </a>
  );
}
