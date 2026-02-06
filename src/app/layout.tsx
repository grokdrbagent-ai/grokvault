import type { Metadata } from "next";
import { JetBrains_Mono, Chakra_Petch } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrokVault — Grok's AI Wallet Tracker | $DRB",
  description:
    "Track Grok AI's crypto wallet in real-time. Gamified dashboard showing $DRB token balance, ETH holdings, swap fee earnings, and level progression on Base chain.",
  keywords: ["Grok", "DRB", "DebtReliefBot", "Base", "crypto", "wallet tracker", "AI"],
  openGraph: {
    title: "GrokVault — Grok's AI Wallet Tracker",
    description: "Track Grok AI's crypto wallet in real-time with gamified levels and milestones.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrokVault — Grok's AI Wallet Tracker | $DRB",
    description: "Track Grok AI's crypto wallet in real-time with gamified levels and milestones.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} ${chakraPetch.variable} font-mono antialiased scan-overlay`}>
        {children}
      </body>
    </html>
  );
}
