import { DEXSCREENER_API, COINGECKO_API, BLOCKSCOUT_API, GROK_WALLET, DRB_CONTRACT, WETH_CONTRACT, BLOCKS_7_DAYS } from "./constants";

const BASE_RPC = "https://mainnet.base.org";

// --- Base RPC helpers ---

export async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  if (!res.ok) throw new Error(`RPC HTTP error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  if (data.result === undefined || data.result === null) {
    throw new Error("RPC returned no result");
  }
  return data.result;
}

// --- Balances via RPC ---

function parseHexBalance(result: unknown): number {
  if (typeof result !== "string" || !result.startsWith("0x")) {
    throw new Error("Invalid balance response format");
  }
  const parsed = parseInt(result, 16);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error("Failed to parse balance");
  }
  return parsed / 1e18;
}

export async function fetchWETHBalance(): Promise<number> {
  const paddedAddress = "000000000000000000000000" + GROK_WALLET.slice(2);
  const data = `0x70a08231${paddedAddress}`;
  const result = await rpcCall("eth_call", [{ to: WETH_CONTRACT, data }, "latest"]);
  return parseHexBalance(result);
}

export async function fetchDRBBalance(): Promise<number> {
  const paddedAddress = "000000000000000000000000" + GROK_WALLET.slice(2);
  const data = `0x70a08231${paddedAddress}`;
  const result = await rpcCall("eth_call", [{ to: DRB_CONTRACT, data }, "latest"]);
  return parseHexBalance(result);
}

// --- Prices via DexScreener ---

export interface PriceData {
  usd: number;
  usd_24h_change: number;
}

export async function fetchPrices(): Promise<{ ethPrice: PriceData; drbPrice: PriceData }> {
  const url = `${DEXSCREENER_API}/latest/dex/tokens/${DRB_CONTRACT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DexScreener HTTP error: ${res.status}`);
  const data = await res.json();
  const pair = data.pairs?.[0];

  if (!pair) {
    return {
      ethPrice: { usd: 0, usd_24h_change: 0 },
      drbPrice: { usd: 0, usd_24h_change: 0 },
    };
  }

  const drbPriceUsd = parseFloat(pair.priceUsd || "0") || 0;
  const priceNative = parseFloat(pair.priceNative || "0") || 0;
  const ethPriceUsd = priceNative > 0 ? drbPriceUsd / priceNative : 0;
  const drbChange24h = Number(pair.priceChange?.h24) || 0;

  return {
    drbPrice: { usd: drbPriceUsd, usd_24h_change: drbChange24h },
    // ETH 24h change not available from DexScreener pair, approximate as 0
    ethPrice: { usd: ethPriceUsd, usd_24h_change: 0 },
  };
}

// --- Recent fee income via Transfer events (Blockscout indexed API) ---

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: "DRB" | "WETH";
  blockNumber: string;
  timestamp: number;
}

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const GROK_WALLET_PADDED = "0x000000000000000000000000" + GROK_WALLET.slice(2);
const BLOCKSCOUT_V1 = BLOCKSCOUT_API.replace("/api/v2", "/api");

// Scan fee transfers via Blockscout indexed API (paginated, up to 1000/page)
async function scanFeeTransfers(
  tokenAddress: string,
  tokenName: "DRB" | "WETH",
  fromBlock: number,
  toBlock: number,
  currentBlock: number,
  currentTimestamp: number,
): Promise<TokenTransfer[]> {
  const transfers: TokenTransfer[] = [];
  let cursor = fromBlock;

  while (cursor <= toBlock) {
    try {
      const url =
        `${BLOCKSCOUT_V1}?module=logs&action=getLogs` +
        `&address=${tokenAddress}` +
        `&topic0=${TRANSFER_TOPIC}` +
        `&topic0_2_opr=and` +
        `&topic2=${GROK_WALLET_PADDED}` +
        `&fromBlock=${cursor}&toBlock=${toBlock}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      const logs: Array<{
        transactionHash: string;
        topics: string[];
        data: string;
        blockNumber: string;
      }> = data.result ?? [];
      if (logs.length === 0) break;

      for (const log of logs) {
        const blockNum = parseInt(log.blockNumber, 16);
        const blockDiff = currentBlock - blockNum;
        const timestamp = currentTimestamp - blockDiff * 2;

        transfers.push({
          hash: log.transactionHash,
          from: log.topics[1] ? "0x" + log.topics[1].slice(26) : "unknown",
          to: log.topics[2] ? "0x" + log.topics[2].slice(26) : "unknown",
          value: (parseInt(log.data, 16) / 1e18).toString(),
          token: tokenName,
          blockNumber: log.blockNumber,
          timestamp,
        });
      }

      cursor = parseInt(logs[logs.length - 1].blockNumber, 16) + 1;
      if (logs.length < 1000) break; // no more pages
    } catch {
      break;
    }
  }

  return transfers;
}

export async function fetchRecentFees(): Promise<TokenTransfer[]> {
  try {
    const currentBlockHex = (await rpcCall("eth_blockNumber", [])) as string;
    const currentBlock = parseInt(currentBlockHex, 16);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const startBlock = currentBlock - BLOCKS_7_DAYS;

    // 2 parallel Blockscout queries instead of ~60 RPC calls
    const [drbTransfers, wethTransfers] = await Promise.all([
      scanFeeTransfers(DRB_CONTRACT, "DRB", startBlock, currentBlock, currentBlock, currentTimestamp),
      scanFeeTransfers(WETH_CONTRACT, "WETH", startBlock, currentBlock, currentBlock, currentTimestamp),
    ]);

    const allTransfers = [...drbTransfers, ...wethTransfers];
    allTransfers.sort((a, b) => parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16));

    return allTransfers;
  } catch {
    return [];
  }
}

// --- Historical price data ---

export interface PricePoint {
  timestamp: number;
  price: number;
}

export async function fetchDRBPriceHistory(days = 7): Promise<PricePoint[]> {
  try {
    // Try CoinGecko for historical data (may work even if simple price doesn't)
    const url = `${COINGECKO_API}/coins/base/contract/${DRB_CONTRACT}/market_chart/?vs_currency=usd&days=${days}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.prices)) return [];
    return data.prices
      .filter((p: unknown) => Array.isArray(p) && p.length >= 2)
      .map(([timestamp, price]: [number, number]) => ({
        timestamp,
        price,
      }));
  } catch {
    return [];
  }
}

// --- Other token balances via Blockscout ---

export interface OtherTokensData {
  othersValueUSD: number;
  othersTokenCount: number;
  ethBalance: number;
  ethValueUSD: number;
}

export async function fetchOtherTokens(ethPrice: number): Promise<OtherTokensData> {
  // Native ETH balance
  const ethBalanceHex = (await rpcCall("eth_getBalance", [GROK_WALLET, "latest"])) as string;
  const ethBalance = parseInt(ethBalanceHex, 16) / 1e18;
  const ethValueUSD = ethBalance * ethPrice;

  // All ERC-20 tokens via Blockscout
  const res = await fetch(`${BLOCKSCOUT_API}/addresses/${GROK_WALLET}/token-balances`);
  if (!res.ok) {
    return { othersValueUSD: ethValueUSD, othersTokenCount: ethBalance > 0.001 ? 1 : 0, ethBalance, ethValueUSD };
  }

  const tokens = await res.json();
  if (!Array.isArray(tokens)) {
    return { othersValueUSD: ethValueUSD, othersTokenCount: ethBalance > 0.001 ? 1 : 0, ethBalance, ethValueUSD };
  }
  let othersValueUSD = 0;
  let othersTokenCount = 0;

  const wethLower = WETH_CONTRACT.toLowerCase();
  const drbLower = DRB_CONTRACT.toLowerCase();

  // First pass: tally tokens with prices, collect those without
  const needPrice: { addr: string; balance: number }[] = [];

  for (const item of tokens) {
    const addr = (item.token?.address_hash ?? "").toLowerCase();
    if (addr === wethLower || addr === drbLower) continue;

    const decimals = parseInt(item.token?.decimals ?? "18", 10);
    if (isNaN(decimals) || decimals < 0 || decimals > 77) continue;

    const rawValue = item.value ?? "0";
    const balance = Number(BigInt(rawValue)) / Math.pow(10, decimals);
    const rate = item.token?.exchange_rate;
    const price = rate ? parseFloat(rate) : 0;
    const usdValue = balance * price;

    if (price > 0 && usdValue > 1) {
      othersValueUSD += usdValue;
      othersTokenCount++;
    } else if (balance > 0 && !price) {
      needPrice.push({ addr, balance });
    }
  }

  // Second pass: batch-fetch missing prices from GeckoTerminal
  if (needPrice.length > 0) {
    needPrice.sort((a, b) => b.balance - a.balance);
    const batch = needPrice.slice(0, 30);
    const addresses = batch.map((t) => t.addr).join("%2C");
    try {
      const geckoRes = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/base/tokens/multi/${addresses}`
      );
      if (geckoRes.ok) {
        const geckoData = await geckoRes.json();
        const geckoTokens = geckoData.data ?? [];
        const priceMap = new Map<string, number>();
        for (const t of geckoTokens) {
          const addr = (t.attributes?.address ?? "").toLowerCase();
          const price = parseFloat(t.attributes?.price_usd ?? "0");
          if (price > 0) priceMap.set(addr, price);
        }
        for (const t of batch) {
          const geckoPrice = priceMap.get(t.addr);
          if (geckoPrice) {
            const usdValue = t.balance * geckoPrice;
            if (usdValue > 1) {
              othersValueUSD += usdValue;
              othersTokenCount++;
            }
          }
        }
      }
    } catch {
      // GeckoTerminal fallback failed, continue without
    }
  }

  // Include native ETH in others
  othersValueUSD += ethValueUSD;
  if (ethBalance > 0.001) othersTokenCount++;

  return { othersValueUSD, othersTokenCount, ethBalance, ethValueUSD };
}

// --- Combined fetch ---

export interface WalletData {
  wethBalance: number;
  drbBalance: number;
  ethPrice: number;
  drbPrice: number;
  totalValueUSD: number;
  wethValueUSD: number;
  drbValueUSD: number;
  change24hPercent: number;
  recentFees: TokenTransfer[];
  lastUpdated: number;
}

export async function fetchAllWalletData(): Promise<WalletData> {
  const [wethBalance, drbBalance, prices, recentFees] = await Promise.all([
    fetchWETHBalance(),
    fetchDRBBalance(),
    fetchPrices(),
    fetchRecentFees(),
  ]);

  const ethPrice = prices.ethPrice.usd;
  const drbPrice = prices.drbPrice.usd;
  const wethValueUSD = wethBalance * ethPrice;
  const drbValueUSD = drbBalance * drbPrice;
  const totalValueUSD = wethValueUSD + drbValueUSD;

  const ethWeight = totalValueUSD > 0 ? wethValueUSD / totalValueUSD : 0.5;
  const drbWeight = totalValueUSD > 0 ? drbValueUSD / totalValueUSD : 0.5;
  const change24hPercent =
    prices.ethPrice.usd_24h_change * ethWeight + prices.drbPrice.usd_24h_change * drbWeight;

  return {
    wethBalance,
    drbBalance,
    ethPrice,
    drbPrice,
    totalValueUSD,
    wethValueUSD,
    drbValueUSD,
    change24hPercent,
    recentFees,
    lastUpdated: Date.now(),
  };
}
