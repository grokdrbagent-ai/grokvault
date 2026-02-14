"use client";

import { motion } from "framer-motion";
import type { PricePoint } from "@/lib/api";

interface SparklineChartProps {
  data: PricePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function SparklineChart({
  data,
  width = 600,
  height = 120,
  className = "",
}: SparklineChartProps) {
  if (data.length < 2) {
    return (
      <div className={`text-white/55 text-xs text-center py-8 ${className}`}>
        loading chart data...
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const padding = { top: 8, bottom: 24, left: 0, right: 0 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.price - minPrice) / priceRange) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const color = "#00EAFF";

  const firstDate = new Date(data[0].timestamp);
  const lastDate = new Date(data[data.length - 1].timestamp);
  const midDate = new Date(data[Math.floor(data.length / 2)].timestamp);
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={areaPath}
          fill="url(#sparkGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2.5"
          fill={color}
        >
          <animate attributeName="r" values="2.5;4;2.5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>

        <text x={padding.left + 4} y={height - 4} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace">
          {formatDate(firstDate)}
        </text>
        <text x={width / 2} y={height - 4} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace" textAnchor="middle">
          {formatDate(midDate)}
        </text>
        <text x={width - padding.right - 4} y={height - 4} fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="monospace" textAnchor="end">
          {formatDate(lastDate)}
        </text>
      </svg>
    </motion.div>
  );
}
