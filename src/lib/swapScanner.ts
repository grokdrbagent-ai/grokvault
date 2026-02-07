import { rpcCall } from "@/lib/api";
import { DRB_WETH_POOL, SWAP_EVENT_TOPIC, LARGE_BUY_THRESHOLD_USD } from "@/lib/constants";

export interface LargeBuy {
  hash: string;
  blockNumber: number;
  drbAmount: number;
  usdValue: number;
  buyer: string;
  timestamp: number;
}

// Decode signed int256 from hex (two's complement)
function decodeInt256(hex: string): bigint {
  const value = BigInt("0x" + hex);
  const MAX_INT256 = (BigInt(1) << BigInt(255)) - BigInt(1);
  if (value > MAX_INT256) {
    return value - (BigInt(1) << BigInt(256));
  }
  return value;
}

interface SwapLog {
  transactionHash: string;
  blockNumber: string;
  data: string;
  topics: string[];
}

// Scan a single chunk of blocks for Swap events
async function scanSwapChunk(fromBlock: string, toBlock: string): Promise<SwapLog[]> {
  try {
    return (await rpcCall("eth_getLogs", [
      {
        address: DRB_WETH_POOL,
        topics: [SWAP_EVENT_TOPIC],
        fromBlock,
        toBlock,
      },
    ])) as SwapLog[];
  } catch {
    return [];
  }
}

export async function fetchLargeBuys(currentDRBPrice: number): Promise<LargeBuy[]> {
  try {
    const currentBlockHex = (await rpcCall("eth_blockNumber", [])) as string;
    const currentBlock = parseInt(currentBlockHex, 16);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Scan last ~7 days (302,400 blocks) in 50K-block chunks
    const CHUNK_SIZE = 50_000;
    const TOTAL_BLOCKS = 302_400;
    const allLogs: SwapLog[] = [];

    const chunkQueries: Array<() => Promise<SwapLog[]>> = [];
    for (let offset = 0; offset < TOTAL_BLOCKS; offset += CHUNK_SIZE) {
      const from = "0x" + (currentBlock - offset - CHUNK_SIZE).toString(16);
      const to = "0x" + (currentBlock - offset).toString(16);
      chunkQueries.push(() => scanSwapChunk(from, to));
    }

    // Run in batches of 2 to stay under rate limits
    for (let i = 0; i < chunkQueries.length; i += 2) {
      const batch = chunkQueries.slice(i, i + 2);
      const results = await Promise.all(batch.map((fn) => fn()));
      for (const logs of results) {
        allLogs.push(...logs);
      }
    }

    const buys: LargeBuy[] = [];

    for (const log of allLogs) {
      // Uniswap V3 Swap event data layout:
      // amount0 (int256) - bytes 0-31
      // amount1 (int256) - bytes 32-63
      const dataHex = log.data.slice(2); // remove 0x
      const amount0Raw = decodeInt256(dataHex.slice(0, 64));

      // A buy = amount0 negative (DRB flows out of pool to buyer)
      if (amount0Raw >= BigInt(0)) continue;

      const drbAmount = Number(-amount0Raw) / 1e18;
      const usdValue = drbAmount * currentDRBPrice;

      if (usdValue < LARGE_BUY_THRESHOLD_USD) continue;

      const blockNum = parseInt(log.blockNumber, 16);
      const blockDiff = currentBlock - blockNum;
      const timestamp = currentTimestamp - blockDiff * 2;

      // Extract buyer from transaction (topic[2] is the recipient in Swap event)
      const buyer = log.topics.length > 2
        ? "0x" + log.topics[2].slice(26)
        : "unknown";

      buys.push({
        hash: log.transactionHash,
        blockNumber: blockNum,
        drbAmount,
        usdValue,
        buyer,
        timestamp,
      });
    }

    // Sort by block descending, return top 10
    buys.sort((a, b) => b.blockNumber - a.blockNumber);
    return buys.slice(0, 10);
  } catch {
    return [];
  }
}
