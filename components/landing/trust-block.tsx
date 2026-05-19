"use client";

import { CheckCircle2 } from "lucide-react";
import { useCounter } from "@/hooks/useCounter";

const STATIC_ITEMS = [
  "3 000+ учениц УПДН — фото «до/после» и протоколы, сработавшие в практике",
  "Экспертиза врачей и нутрициологов УПДН, включая Первый МГМУ им. И.М. Сеченова",
] as const;

export function TrustBlock() {
  const liveCount = useCounter();
  const scanItem = `${liveCount ?? 327}+ реальных сканирований — каждое новое делает модель точнее`;
  const items = [scanItem, ...STATIC_ITEMS];

  return (
    <section className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-center mb-8">
          Почему этому анализу можно доверять
        </h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={20} />
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
