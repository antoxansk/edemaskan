"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 12_000;

export function useCounter(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/counter");
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        setCount(data.count);
      } catch {
        // Silently ignore — fallback value stays
      }
    }

    void fetchCount();
    const interval = setInterval(() => void fetchCount(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return count;
}
