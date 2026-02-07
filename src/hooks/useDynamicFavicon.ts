"use client";

import { useEffect } from "react";

export function useDynamicFavicon(change24h: number | null) {
  useEffect(() => {
    if (change24h === null) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, 32, 32);

      // Arrow triangle
      const isUp = change24h >= 0;
      ctx.fillStyle = isUp ? "#39FF14" : "#FF2D55";
      ctx.beginPath();
      if (isUp) {
        // Up arrow
        ctx.moveTo(16, 6);
        ctx.lineTo(26, 24);
        ctx.lineTo(6, 24);
      } else {
        // Down arrow
        ctx.moveTo(16, 26);
        ctx.lineTo(26, 8);
        ctx.lineTo(6, 8);
      }
      ctx.closePath();
      ctx.fill();

      const dataURL = canvas.toDataURL("image/png");

      // Find or create favicon link element
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.type = "image/png";
      link.href = dataURL;
    } catch {
      // Fail silently — progressive enhancement
    }
  }, [change24h]);
}
