import type { Metadata } from "next";
import Script from "next/script";
import { JetBrains_Mono, Chakra_Petch } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const GA_ID = "G-HHEFDPKNG7";

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
    url: "https://grokvault.xyz",
    images: [
      {
        url: "https://grokvault.xyz/thumb.png",
        width: 1200,
        height: 628,
        alt: "GrokVault — Grok's AI Wallet Tracker Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrokVault — Grok's AI Wallet Tracker | $DRB",
    description: "Track Grok AI's crypto wallet in real-time with gamified levels and milestones.",
    images: ["https://grokvault.xyz/thumb.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className={`${jetbrainsMono.variable} ${chakraPetch.variable} font-mono antialiased scan-overlay`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
