"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const COLORS = ["#39FF14", "#00EAFF", "#39FF14", "#39FF14", "#FFB800"];

interface CoinRainProps {
  trigger: number;
}

export function CoinRain({ trigger }: CoinRainProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger === 0) return;

    const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40, // cluster around center
      y: 40 + Math.random() * 20,
      size: 2 + Math.random() * 4,
      duration: 1 + Math.random() * 1.5,
      delay: Math.random() * 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: `${p.x}vw`,
              y: `${p.y}vh`,
              scale: 1,
              opacity: 1,
            }}
            animate={{
              y: `${p.y - 30 - Math.random() * 20}vh`,
              x: `${p.x + (Math.random() - 0.5) * 20}vw`,
              scale: 0,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}40`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
