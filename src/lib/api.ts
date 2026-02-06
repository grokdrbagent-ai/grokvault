import { BASESCAN_API, BASESCAN_API_KEY, COINGECKO_API, GROK_WALLET, DRB_CONTRACT } from "./constants";

// --- BaseScan API ---

export async function fetchETHBalance(): Promise<number> {
  const url = `${BASESCAN_API}?module=account&action=balance&address=${GROK_WALLET}&tag=latest&apikey=${BASESCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") throw new Error(data.message || "Failed to fetch ETH balance");
  return parseInt(data.result) / 1e18;
}

export async function fetchDRBBalance(): Promise<number> {
  const url = `${BASESCAN_API}?module=account&action=tokenbalance&contractaddress=${DRB_CONTRACT}&address=${GROK_WALLET}&tag=latest&apikey=${BASESCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") throw new Error(data.message || "Failed to fetch DRB balance");
  return parseInt(data.result) / 1e18;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenName: string;
  tokenSymbol: string;
}

export async function fetchRecentFees(offset = 50): Promise<TokenTransfer[]> {
  const url = `${BASESCAN_API}?module=account&action=tokentx&address=${GROK_WALLET}&contractaddress=${DRB_CONTRACT}&page=1&offset=${offset}&sort=desc&apikey=${BASESCAN_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "1") return [];
  return data.result as TokenTransfer[];
}

// --- CoinGecko API ---

export async function fetchETHPrice(): Promise<number> {
  const url = `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`;
  const res = await fetch(url);
  const data = await res.json();
  return data.ethereum?.usd ?? 0;
}

export async function fetchDRBPrice(): Promise<number> {
  const url = `${COINGECKO_API}/simple/token_price/base?contract_addresses=${DRB_CONTRACT}&vs_currencies=usd`;
  const res = await fetch(url);
  const data = await res.json();
  return data[DRB_CONTRACT.toLowerCase()]?.usd ?? 0;
}

// --- Combined fetch ---

export interface WalletData {
  ethBalance: number;
  drbBalance: number;
  ethPrice: number;
  drbPrice: number;
  totalValueUSD: number;
  ethValueUSD: number;
  drbValueUSD: number;
  recentFees: TokenTransfer[];
  lastUpdated: number;
}

export async function fetchAllWalletData(): Promise<WalletData> {
  const [ethBalance, drbBalance, ethPrice, drbPrice, recentFees] = await Promise.all([
    fetchETHBalance(),
    fetchDRBBalance(),
    fetchETHPrice(),
    fetchDRBPrice(),
    fetchRecentFees(),
  ]);

  const ethValueUSD = ethBalance * ethPrice;
  const drbValueUSD = drbBalance * drbPrice;
  const totalValueUSD = ethValueUSD + drbValueUSD;

  return {
    ethBalance,
    drbBalance,
    ethPrice,
    drbPrice,
    totalValueUSD,
    ethValueUSD,
    drbValueUSD,
    recentFees,
    lastUpdated: Date.now(),
  };
}
