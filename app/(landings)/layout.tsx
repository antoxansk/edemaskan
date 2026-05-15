import Link from "next/link";
import { FooterDisclaimer } from "@/components/shared/footer-disclaimer";
import { LandingPageTracker } from "@/components/shared/landing-tracker";

export default function LandingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-base font-semibold text-primary">Edemaskan</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">by УПДН</span>
        </Link>
      </header>

      <LandingPageTracker />
      <main className="flex-1">{children}</main>

      <FooterDisclaimer />
    </div>
  );
}
