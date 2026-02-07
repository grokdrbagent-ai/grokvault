// Wallet & Contract addresses
export const GROK_WALLET = "0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9";
export const DRB_CONTRACT = "0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2";
export const WETH_CONTRACT = "0x4200000000000000000000000000000000000006";

// API endpoints
export const DEXSCREENER_API = "https://api.dexscreener.com";
export const COINGECKO_API = "https://api.coingecko.com/api/v3"; // fallback for historical data
export const BLOCKSCOUT_API = "https://base.blockscout.com/api/v2";

// Polling interval (ms)
export const REFRESH_INTERVAL = 60_000;

// Level system
export const LEVELS = [
  { level: 1, name: "Broke Bot", minValue: 0, emoji: "\u{1F916}" },
  { level: 2, name: "Pocket Change", minValue: 10_000, emoji: "\u{1FA99}" },
  { level: 3, name: "Side Hustle", minValue: 50_000, emoji: "\u{1F4B0}" },
  { level: 4, name: "Six Figure Degen", minValue: 100_000, emoji: "\u{1F525}" },
  { level: 5, name: "Half Mill Club", minValue: 500_000, emoji: "\u{1F48E}" },
  { level: 6, name: "Millionaire Bot", minValue: 1_000_000, emoji: "\u{1F3C6}" },
  { level: 7, name: "Whale Status", minValue: 2_000_000, emoji: "\u{1F40B}" },
  { level: 8, name: "Crypto Overlord", minValue: 5_000_000, emoji: "\u{1F451}" },
  { level: 9, name: "Base Legend", minValue: 10_000_000, emoji: "\u2B50" },
  { level: 10, name: "AI Tycoon", minValue: 50_000_000, emoji: "\u{1F9E0}" },
] as const;

// Milestones
export const MILESTONES = [
  { label: "$10K", value: 10_000, emoji: "\u{1F949}" },
  { label: "$50K", value: 50_000, emoji: "\u{1F948}" },
  { label: "$100K", value: 100_000, emoji: "\u{1F947}" },
  { label: "$500K", value: 500_000, emoji: "\u{1F48E}" },
  { label: "$1M", value: 1_000_000, emoji: "\u{1F3C6}" },
  { label: "$2M", value: 2_000_000, emoji: "\u{1F40B}" },
  { label: "$5M", value: 5_000_000, emoji: "\u{1F451}" },
  { label: "$10M", value: 10_000_000, emoji: "\u{1F31F}" },
] as const;

// Uniswap V3 Pool (DRB/WETH)
export const DRB_WETH_POOL = "0x5116773e18A9C7bB03EBB961b38678E45E238923";
export const SWAP_EVENT_TOPIC = "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67";
export const LARGE_BUY_THRESHOLD_USD = 1_000;

// External links
export const LINKS = {
  buyDRB: "https://app.uniswap.org/swap?outputCurrency=0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2&chain=base",
  community: "https://t.me/agentstoagents",
  twitter: "https://x.com/agentstoagents",
  grokWallet: "https://basescan.org/address/0xb1058c959987e3513600eb5b4fd82aeee2a0e4f9",
  drbContract: "https://basescan.org/token/0x3ec2156d4c0a9cbdab4a016633b7bcf6a8d68ea2",
} as const;
