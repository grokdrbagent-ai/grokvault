interface Comparison {
  template: (value: number) => string;
  minValue: number;
  category: string;
}

const COMPARISONS: Comparison[] = [
  {
    template: (v) => `grok could buy ${Math.floor(v / 6.5).toLocaleString()} Big Macs`,
    minValue: 100,
    category: "food",
  },
  {
    template: (v) => `grok could fund ${Math.floor(v / 15.99).toLocaleString()} months of Netflix`,
    minValue: 500,
    category: "subscription",
  },
  {
    template: (v) => `grok could buy ${Math.floor(v / 999).toLocaleString()} iPhones`,
    minValue: 1_000,
    category: "tech",
  },
  {
    template: (v) => `grok could buy ${Math.floor(v / 2_500).toLocaleString()} ETH validators`,
    minValue: 5_000,
    category: "crypto",
  },
  {
    template: (v) => `grok holds more than ${Math.floor(v / 45_000).toLocaleString()} Teslas worth`,
    minValue: 45_000,
    category: "auto",
  },
  {
    template: (v) =>
      `grok could pay ${Math.floor(v / 50_000).toLocaleString()} semesters of college tuition`,
    minValue: 50_000,
    category: "education",
  },
  {
    template: (v) =>
      `grok has more than a typical US household (${Math.floor(v / 192_000)}x median net worth)`,
    minValue: 100_000,
    category: "wealth",
  },
  {
    template: (v) => `grok could buy ${Math.floor(v / 350_000).toLocaleString()} US median homes`,
    minValue: 350_000,
    category: "real-estate",
  },
  {
    template: () => "grok is richer than 90% of Americans",
    minValue: 150_000,
    category: "percentile",
  },
  {
    template: () => "grok is richer than 95% of Americans",
    minValue: 500_000,
    category: "percentile",
  },
  {
    template: () => "grok is a USD millionaire",
    minValue: 1_000_000,
    category: "milestone",
  },
  {
    template: (v) =>
      `grok could run ${Math.floor(v / 200).toLocaleString()} months of a premium VPS`,
    minValue: 1_000,
    category: "tech",
  },
  {
    template: (v) => `grok has ${Math.floor(v / 69_000).toLocaleString()} BTC worth of value`,
    minValue: 10_000,
    category: "crypto",
  },
  {
    template: (v) =>
      `grok could buy ${Math.floor(v / 12).toLocaleString()} $DRB domain renewals`,
    minValue: 100,
    category: "degen",
  },
  {
    template: (v) =>
      `grok could fund ${Math.floor(v / 5_000).toLocaleString()} round trips to Tokyo`,
    minValue: 5_000,
    category: "travel",
  },
];

export function getRandomComparison(value: number): string | null {
  const eligible = COMPARISONS.filter((c) => value >= c.minValue);
  if (eligible.length === 0) return null;

  // Deterministic per 5-second window
  const seed = Math.floor(Date.now() / 5_000);
  const index = seed % eligible.length;
  return eligible[index].template(value);
}
