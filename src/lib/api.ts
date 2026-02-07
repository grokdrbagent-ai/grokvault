import { DEXSCREENER_API, COINGECKO_API, BLOCKSCOUT_API, GROK_WALLET, DRB_CONTRACT, WETH_CONTRACT } from "./constants";

const BASE_RPC = "https://mainnet.base.org";

// --- Base RPC helpers ---

export async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(BASE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "RPC error");
  return data.result;
}

// --- Balances via RPC ---

export async function fetchWETHBalance(): Promise<number> {
  const paddedAddress = "000000000000000000000000" + GROK_WALLET.slice(2);
  const data = `0x70a08231${paddedAddress}`;
  const result = (await rpcCall("eth_call", [{ to: WETH_CONTRACT, data }, "latest"])) as string;
  return parseInt(result, 16) / 1e18;
}

export async function fetchDRBBalance(): Promise<number> {
  const paddedAddress = "000000000000000000000000" + GROK_WALLET.slice(2);
  const data = `0x70a08231${paddedAddress}`;
  const result = (await rpcCall("eth_call", [{ to: DRB_CONTRACT, data }, "latest"])) as string;
  return parseInt(result, 16) / 1e18;
}

// --- Prices via DexScreener ---

export interface PriceData {
  usd: number;
  usd_24h_change: number;
}

export async function fetchPrices(): Promise<{ ethPrice: PriceData; drbPrice: PriceData }> {
  const url = `${DEXSCREENER_API}/latest/dex/tokens/${DRB_CONTRACT}`;
  const res = await fetch(url);
  const data = await res.json();
  const pair = data.pairs?.[0];

  if (!pair) {
    return {
      ethPrice: { usd: 0, usd_24h_change: 0 },
      drbPrice: { usd: 0, usd_24h_change: 0 },
    };
  }

  const drbPriceUsd = parseFloat(pair.priceUsd || "0");
  const priceNative = parseFloat(pair.priceNative || "0");
  const ethPriceUsd = priceNative > 0 ? drbPriceUsd / priceNative : 0;
  const drbChange24h = pair.priceChange?.h24 ?? 0;

  return {
    drbPrice: { usd: drbPriceUsd, usd_24h_change: drbChange24h },
    // ETH 24h change not available from DexScreener pair, approximate as 0
    ethPrice: { usd: ethPriceUsd, usd_24h_change: 0 },
  };
}

// --- Recent fee income via Transfer events ---

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

// Scan a chunk for Transfer events of a specific token TO Grok wallet
async function scanTokenChunk(
  tokenAddress: string,
  tokenName: "DRB" | "WETH",
  fromBlock: string,
  toBlock: string
): Promise<TokenTransfer[]> {
  try {
    const logs = (await rpcCall("eth_getLogs", [
      {
        address: tokenAddress,
        topics: [TRANSFER_TOPIC, null, GROK_WALLET_PADDED],
        fromBlock,
        toBlock,
      },
    ])) as Array<{
      transactionHash: string;
      topics: string[];
      data: string;
      blockNumber: string;
    }>;

    return logs.map((log) => ({
      hash: log.transactionHash,
      from: "0x" + log.topics[1].slice(26),
      to: "0x" + log.topics[2].slice(26),
      value: (parseInt(log.data, 16) / 1e18).toString(),
      token: tokenName,
      blockNumber: log.blockNumber,
      timestamp: 0,
    }));
  } catch {
    return [];
  }
}

export async function fetchRecentFees(): Promise<TokenTransfer[]> {
  try {
    const currentBlockHex = (await rpcCall("eth_blockNumber", [])) as string;
    const currentBlock = parseInt(currentBlockHex, 16);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Scan last ~7 days in 10K-block chunks (Base ~2s blocks)
    const CHUNK_SIZE = 10000;
    const TOTAL_BLOCKS = 302400; // ~7 days
    const allTransfers: TokenTransfer[] = [];

    // Build chunk queries: DRB and WETH Transfer events separately
    const chunkQueries: Array<() => Promise<TokenTransfer[]>> = [];
    for (let offset = 0; offset < TOTAL_BLOCKS; offset += CHUNK_SIZE) {
      const from = "0x" + (currentBlock - offset - CHUNK_SIZE).toString(16);
      const to = "0x" + (currentBlock - offset).toString(16);
      chunkQueries.push(() => scanTokenChunk(DRB_CONTRACT, "DRB", from, to));
      chunkQueries.push(() => scanTokenChunk(WETH_CONTRACT, "WETH", from, to));
    }

    // Run in batches of 8 to maximize throughput
    for (let i = 0; i < chunkQueries.length; i += 8) {
      const batch = chunkQueries.slice(i, i + 8);
      const results = await Promise.all(batch.map((fn) => fn()));
      for (const transfers of results) {
        allTransfers.push(...transfers);
      }
    }

    // Estimate timestamps based on block number difference from current
    for (const tx of allTransfers) {
      const blockDiff = currentBlock - parseInt(tx.blockNumber, 16);
      tx.timestamp = currentTimestamp - blockDiff * 2; // ~2s per block
    }

    // Sort by block number descending (most recent first)
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
    return (data.prices ?? []).map(([timestamp, price]: [number, number]) => ({
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
  let othersValueUSD = 0;
  let othersTokenCount = 0;

  const wethLower = WETH_CONTRACT.toLowerCase();
  const drbLower = DRB_CONTRACT.toLowerCase();

  for (const item of tokens) {
    const addr = (item.token?.address_hash ?? "").toLowerCase();
    if (addr === wethLower || addr === drbLower) continue;

    const decimals = parseInt(item.token?.decimals ?? "18", 10);
    if (isNaN(decimals)) continue;

    const rawValue = item.value ?? "0";
    const balance = Number(BigInt(rawValue)) / Math.pow(10, decimals);
    const price = parseFloat(item.token?.exchange_rate ?? "0");
    const usdValue = balance * price;

    if (usdValue > 1) {
      othersValueUSD += usdValue;
      othersTokenCount++;
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
