"use client";

import { useCounter } from "@/hooks/useCounter";

// Shown in Hero under the CTA button — no count-up animation (per spec)
export function LiveCounter() {
  const count = useCounter();
  // Show base 327 until API responds
  const display = count ?? 327;

  return (
    <p className="mt-3 text-sm font-medium text-emerald-700">
      🟢 {display} человек успешно прошли сканирование
    </p>
  );
}
