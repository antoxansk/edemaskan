"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const STORAGE_KEY = "edemaskan_offer_expires_at";
const DURATION_MS = 48 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function getOrCreateExpiry(): number {
  if (typeof window === "undefined") return Date.now() + DURATION_MS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts) && ts > Date.now()) return ts;
  }
  const expires = Date.now() + DURATION_MS;
  localStorage.setItem(STORAGE_KEY, String(expires));
  return expires;
}

type TimeLeft = { h: number; m: number; s: number };

export function OfferTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const expiresAt = getOrCreateExpiry();

    function tick() {
      const diff = Math.max(0, expiresAt - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // null until first tick runs on client (avoids hydration mismatch)
  if (!timeLeft) return null;

  return (
    <div className="rounded-2xl p-5 text-center bg-accent-soft">
      <Clock size={24} className="text-accent mx-auto mb-2" aria-hidden="true" />
      <p className="text-base font-medium text-text-muted mb-4">
        Специальная цена действует ещё
      </p>
      <div className="flex items-end justify-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold tabular-nums text-accent leading-none">
            {pad(timeLeft.h)}
          </span>
          <span className="text-xs text-text-muted mt-1">часов</span>
        </div>
        <span className="text-2xl font-bold text-accent pb-4 leading-none">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold tabular-nums text-accent leading-none">
            {pad(timeLeft.m)}
          </span>
          <span className="text-xs text-text-muted mt-1">минут</span>
        </div>
        <span className="text-2xl font-bold text-accent pb-4 leading-none">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold tabular-nums text-accent leading-none">
            {pad(timeLeft.s)}
          </span>
          <span className="text-xs text-text-muted mt-1">секунд</span>
        </div>
      </div>
    </div>
  );
}
