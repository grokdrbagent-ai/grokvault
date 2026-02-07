"use client";

import { useState, useEffect, useRef } from "react";
import { getATH, updateATH } from "@/lib/storage";

interface ATHState {
  value: number;
  timestamp: number;
}

interface UsePersonalATHReturn {
  ath: ATHState | null;
  isNewATH: boolean;
}

export function usePersonalATH(currentValue: number | null): UsePersonalATHReturn {
  const [ath, setAth] = useState<ATHState | null>(null);
  const [isNewATH, setIsNewATH] = useState(false);
  const initializedRef = useRef(false);

  // On mount, read existing ATH
  useEffect(() => {
    const existing = getATH();
    if (existing) setAth(existing);
    initializedRef.current = true;
  }, []);

  // On value change, check/update ATH
  useEffect(() => {
    if (!initializedRef.current || currentValue === null || currentValue <= 0) return;
    const result = updateATH(currentValue);
    setAth(result.ath);
    setIsNewATH(result.isNewATH);
  }, [currentValue]);

  return { ath, isNewATH };
}
