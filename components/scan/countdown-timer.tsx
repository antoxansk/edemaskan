"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type CountdownTimerProps = {
  expiresAt: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining]);

  if (remaining <= 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Специальная цена недавно завершилась
      </p>
    );
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  return (
    <div className="flex items-center gap-2 justify-center text-primary font-semibold">
      <Clock size={18} className="shrink-0" />
      <span className="text-xl font-mono">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    </div>
  );
}
