import { formatUSD, formatTokenAmount, timeAgo } from "@/lib/game";
import type { TokenTransfer } from "@/lib/api";

export interface TickerEvent {
  id: string;
  text: string;
  type: "fee" | "price" | "milestone";
}

export function generateTickerEvents(
  recentFees: TokenTransfer[],
  drbPrice: number,
  ethPrice: number,
  totalValueUSD: number
): TickerEvent[] {
  const events: TickerEvent[] = [];

  // Recent fee claims (last 5 unique transactions grouped)
  const seenHashes = new Set<string>();
  const recentUnique: TokenTransfer[] = [];
  for (const fee of recentFees) {
    if (!seenHashes.has(fee.hash) && recentUnique.length < 5) {
      seenHashes.add(fee.hash);
      recentUnique.push(fee);
    }
  }

  for (const fee of recentUnique) {
    const amount = parseFloat(fee.value);
    const price = fee.token === "DRB" ? drbPrice : ethPrice;
    const usdValue = amount * price;
    const ago = fee.timestamp > 0 ? timeAgo(fee.timestamp) : "";
    events.push({
      id: `fee-${fee.hash}`,
      text: `+${formatTokenAmount(amount)} ${fee.token} claimed (${formatUSD(usdValue)})${ago ? ` — ${ago}` : ""}`,
      type: "fee",
    });
  }

  // Price line
  events.push({
    id: "price-drb",
    text: `$DRB: $${drbPrice.toFixed(8)}`,
    type: "price",
  });

  // Milestone checks
  const thresholds = [10_000, 50_000, 100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];
  for (const t of thresholds) {
    if (totalValueUSD >= t && totalValueUSD < t * 1.05) {
      events.push({
        id: `milestone-${t}`,
        text: `milestone: grok wallet passed ${formatUSD(t)}`,
        type: "milestone",
      });
      break;
    }
  }

  return events;
}
