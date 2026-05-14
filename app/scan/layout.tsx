"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ScanProvider } from "@/components/scan/scan-provider";

const STEPS: Record<string, number> = {
  "/scan":                   1,
  "/scan/photos":            2,
  "/scan/questionnaire":     3,
  "/scan/analyzing":         4,
  "/scan/email":             5,
  "/scan/result":            6,
};

const TOTAL = 6;

function ScanHeader({ step }: { step: number }) {
  const showBack = step > 1 && step < 6;
  const backPath =
    step === 2 ? "/scan" :
    step === 3 ? "/scan/photos" :
    step === 5 ? "/scan/questionnaire" : null;

  return (
    <header className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        {showBack && backPath ? (
          <Link href={backPath} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={20} />
          </Link>
        ) : (
          <div className="w-5" />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Шаг {step} из {TOTAL}</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL) * 100}%` }}
            />
          </div>
        </div>

        <span className="text-sm font-semibold text-primary">Edemaskan</span>
      </div>
    </header>
  );
}

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = STEPS[pathname] ?? 1;

  return (
    <ScanProvider>
      <div className="flex flex-col min-h-full bg-background">
        <ScanHeader step={step} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
          {children}
        </main>
      </div>
    </ScanProvider>
  );
}
