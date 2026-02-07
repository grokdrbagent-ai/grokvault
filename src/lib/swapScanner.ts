import { rpcCall } from "@/lib/api";
import { DRB_WETH_POOL, SWAP_EVENT_TOPIC, LARGE_BUY_THRESHOLD_USD } from "@/lib/constants";
import { BLOCKSCOUT_API } from "@/lib/constants";

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

// Blockscout v1 (Etherscan-compatible) API base
const BLOCKSCOUT_V1 = BLOCKSCOUT_API.replace("/api/v2", "/api");

interface EtherscanLog {
  blockNumber: string;
  transactionHash: string;
  data: string;
  topics: string[];
  timeStamp: string;
}

// Scan a block range using Blockscout indexed API (paginated, 1000 per page)
async function scanRange(
  fromBlock: number,
  toBlock: number,
  currentDRBPrice: number,
  currentTimestamp: number,
  currentBlock: number,
): Promise<LargeBuy[]> {
  const buys: LargeBuy[] = [];
  let cursor = fromBlock;

  while (cursor < toBlock) {
    try {
      const url =
        `${BLOCKSCOUT_V1}?module=logs&action=getLogs` +
        `&address=${DRB_WETH_POOL}` +
        `&topic0=${SWAP_EVENT_TOPIC}` +
        `&fromBlock=${cursor}&toBlock=${toBlock}`;

      const res = await fetch(url);
      if (!res.ok) break;

      const data = await res.json();
      const logs: EtherscanLog[] = data.result ?? [];
      if (logs.length === 0) break;

      for (const log of logs) {
        const dataHex = log.data.slice(2);
        if (dataHex.length < 128) continue;

        const amount0Raw = decodeInt256(dataHex.slice(0, 64));
        // A buy = amount0 negative (DRB flows out of pool to buyer)
        if (amount0Raw >= BigInt(0)) continue;

        const drbAmount = Number(-amount0Raw) / 1e18;
        const usdValue = drbAmount * currentDRBPrice;
        if (usdValue < LARGE_BUY_THRESHOLD_USD) continue;

        const blockNum = parseInt(log.blockNumber, 16);
        const blockDiff = currentBlock - blockNum;
        const timestamp = currentTimestamp - blockDiff * 2;

        const buyer =
          log.topics?.length > 2
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

      // Move cursor past last log for next page
      cursor = parseInt(logs[logs.length - 1].blockNumber, 16) + 1;
      if (logs.length < 1000) break; // no more pages
    } catch {
      break;
    }
  }

  return buys;
}

export async function fetchLargeBuys(currentDRBPrice: number): Promise<LargeBuy[]> {
  try {
    const currentBlockHex = (await rpcCall("eth_blockNumber", [])) as string;
    const currentBlock = parseInt(currentBlockHex, 16);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Scan last ~7 days (302,400 blocks) split into 3 parallel ranges
    const TOTAL_BLOCKS = 302_400;
    const startBlock = currentBlock - TOTAL_BLOCKS;
    const third = Math.floor(TOTAL_BLOCKS / 3);

    const [r1, r2, r3] = await Promise.all([
      scanRange(startBlock, startBlock + third, currentDRBPrice, currentTimestamp, currentBlock),
      scanRange(startBlock + third, startBlock + 2 * third, currentDRBPrice, currentTimestamp, currentBlock),
      scanRange(startBlock + 2 * third, currentBlock, currentDRBPrice, currentTimestamp, currentBlock),
    ]);

    const buys = [...r1, ...r2, ...r3];
    buys.sort((a, b) => b.blockNumber - a.blockNumber);
    return buys.slice(0, 10);
  } catch {
    return [];
  }
}
