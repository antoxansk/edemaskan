"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  scenario: string;
  ctaText?: string;
};

export function StickyBottomCTA({ scenario, ctaText = "→ Узнать причину своего отёка" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroSection  = document.querySelector("[data-hero-section]");
    const landingFooter = document.querySelector("[data-landing-footer]");

    if (!heroSection || !landingFooter) return;

    // Show when hero section leaves viewport
    const heroObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    // Hide when footer enters viewport
    const footerObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) setVisible(false);
      },
      { threshold: 0.1 }
    );

    heroObserver.observe(heroSection);
    footerObserver.observe(landingFooter);

    return () => {
      heroObserver.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        transform:  visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 250ms ease-out",
        padding:    "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop:  "1px solid var(--color-border)",
      }}
    >
      <Link
        href={`/scan?from=${scenario}`}
        className="btn-emerald-cta flex items-center justify-center gap-2 w-full py-3 px-6 text-base font-bold rounded-full"
        data-event="cta_click"
        data-scenario={scenario}
      >
        {ctaText}
      </Link>
    </div>
  );
}
