import Link from "next/link";
import { FooterDisclaimer } from "@/components/shared/footer-disclaimer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border px-4 py-3">
        <Link href="/" className="text-base font-semibold text-primary hover:opacity-80 transition-opacity">
          Edemaskan
        </Link>
      </header>
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        {children}
      </main>
      <FooterDisclaimer />
    </div>
  );
}
