"use client";

import { LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 pt-6 pb-8">
      <div className="glow-divider mb-6" />

      {/* Primary actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
        <a
          href={LINKS.genesisPost}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-[#00EAFF]/20 bg-[#00EAFF]/[0.04] px-4 py-2 text-xs font-mono text-[#00EAFF]/70 transition-all hover:text-[#00EAFF] hover:border-[#00EAFF]/35 hover:bg-[#00EAFF]/[0.07]"
        >
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          read the genesis post
        </a>
        <a
          href={LINKS.learnDRB}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-mono text-white/55 transition-all hover:text-white/80 hover:border-white/20 hover:bg-white/[0.04]"
        >
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          learn more about $DRB
        </a>
        <a
          href={LINKS.taskForce}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-[#FFB800]/20 bg-[#FFB800]/[0.04] px-4 py-2 text-xs font-mono text-[#FFB800]/70 transition-all hover:text-[#FFB800] hover:border-[#FFB800]/35 hover:bg-[#FFB800]/[0.07]"
        >
          DRB task force
        </a>
      </div>

      {/* Secondary links */}
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
