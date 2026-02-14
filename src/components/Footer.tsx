"use client";

import { LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 pt-6 pb-8">
      <div className="glow-divider mb-6" />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono">
        <a
          href={LINKS.buyDRB}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#39FF14]/60 hover:text-[#39FF14] transition-colors"
        >
          buy $DRB
        </a>
        <a
          href={LINKS.community}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/55 hover:text-white/70 transition-colors"
        >
          community
        </a>
        <a
          href={LINKS.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/55 hover:text-white/70 transition-colors"
        >
          twitter
        </a>
        <a
          href={LINKS.grokWallet}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/55 hover:text-white/70 transition-colors"
        >
          view wallet
        </a>
      </div>
      <div className="text-center mt-4 text-xs text-white/55 font-mono">
        built by draco.base.eth
      </div>
    </footer>
  );
}
