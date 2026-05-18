"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Props = {
  url: string;
  discountPercent: number;
  priceFormatted: string;
  sentinelId: string;
};

export function StickyBottomCTA({ url, discountPercent, priceFormatted, sentinelId }: Props) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // Show CTA when programs section is NOT in view (user scrolled past it)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observerRef.current.observe(sentinel);

    return () => observerRef.current?.disconnect();
  }, [sentinelId]);

  const scrollToPrograms = () => {
    const el = document.getElementById("programs-section");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.style.transition = "box-shadow 150ms ease";
    el.style.boxShadow = "0 0 0 3px #6B9080, 0 0 0 6px #CCE3DE";
    setTimeout(() => { el.style.boxShadow = ""; }, 1000);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t border-border bg-bg-card md:hidden animate-slide-up"
      style={{ boxShadow: "0 -4px 16px rgb(45 42 38 / 0.08)" }}
    >
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-event="cta_sticky"
        onClick={scrollToPrograms}
        className="flex items-center justify-center w-full h-14 rounded-full text-lg font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 btn-emerald-cta"
      >
        Применить скидку {discountPercent}% — {priceFormatted}
      </Link>
    </div>
  );
}
