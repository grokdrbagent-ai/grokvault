"use client";

import { LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-12 py-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/30">
        <span>
          Built by{" "}
          <span className="text-[#0052FF]">draco.base.eth</span>{" "}
          <span className="text-[#0052FF]">{"🔵"}</span>
        </span>
        <span className="hidden sm:inline text-white/10">|</span>
        <a
          href={LINKS.buyDRB}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00FF88] hover:text-[#00FF88]/80 transition-colors"
        >
          Buy $DRB
        </a>
        <span className="hidden sm:inline text-white/10">|</span>
        <a
          href={LINKS.community}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/50 transition-colors"
        >
          Community
        </a>
        <span className="hidden sm:inline text-white/10">|</span>
        <a
          href={LINKS.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/50 transition-colors"
        >
          Twitter
        </a>
        <span className="hidden sm:inline text-white/10">|</span>
        <a
          href={LINKS.grokWallet}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white/50 transition-colors"
        >
          View Wallet
        </a>
      </div>
    </footer>
  );
}
