"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FactsCarousel } from "@/components/scan/facts-carousel";
import { isValidScenario } from "@/lib/scenarios";

function readUtm() {
  try {
    const raw = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("edm_utm="));
    if (!raw) return {};
    return JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("="))) as Record<string, string>;
  } catch {
    return {};
  }
}

function ScanPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const fromParam  = params.get("from") ?? "morning-face";
  const scenario   = isValidScenario(fromParam) ? fromParam : "morning-face";
  const autoStart  = params.get("autostart") === "1";

  const [consentPdn, setConsentPdn]   = useState(autoStart);
  const [consentScan, setConsentScan] = useState(autoStart);
  const [loading, setLoading]         = useState(false);

  const canStart = consentPdn && consentScan;

  // Auto-submit when coming from QR (autostart=1) — consent already given on desktop
  useEffect(() => {
    if (!autoStart) return;
    const timer = setTimeout(() => { void handleStart(); }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function handleStart() {
    if (!canStart || loading) return;
    setLoading(true);

    try {
      const utm = readUtm();
      const res = await fetch("/api/scan/start", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          entry_scenario: scenario,
          consent_pdn:    true,
          consent_scan:   true,
          utm:            Object.keys(utm).length > 0 ? utm : undefined,
          referer:        document.referrer || null,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        session_id?: string;
        session_token?: string;
        error?: { code: string; message: string };
      };

      if (!res.ok || !data.success) {
        toast.error(data.error?.message ?? "Не удалось начать. Попробуйте обновить страницу.");
        return;
      }

      try {
        sessionStorage.setItem("edm_session_id",     data.session_id!);
        sessionStorage.setItem("edm_session_token",  data.session_token!);
        sessionStorage.setItem("edm_entry_scenario", scenario);
      } catch {
        // Safari Private Mode fallback
        document.cookie = `edm_session_id=${data.session_id}; path=/; samesite=lax`;
        document.cookie = `edm_session_token=${data.session_token}; path=/; samesite=lax`;
      }

      router.push("/scan/photos");
    } catch {
      toast.error("Не удалось начать. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">За 60 секунд узнайте причину своего отёка</h1>
        <p className="text-sm text-muted-foreground">AI-разбор по методологии УПДН</p>
      </div>

      <FactsCarousel />

      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
        <Lightbulb size={16} className="shrink-0 mt-0.5 text-accent-foreground" />
        <span>Подготовьте телефон с хорошим освещением. Без очков и фильтров.</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="consent-pdn"
            checked={consentPdn}
            onCheckedChange={(v) => setConsentPdn(v === true)}
            className="mt-0.5 shrink-0 h-5 w-5"
          />
          <span className="text-sm leading-relaxed">
            Я ознакомлен(а) с{" "}
            <Link href="/legal/privacy" target="_blank" rel="noopener" className="underline text-primary">
              Политикой обработки персональных данных
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="consent-scan"
            checked={consentScan}
            onCheckedChange={(v) => setConsentScan(v === true)}
            className="mt-0.5 shrink-0 h-5 w-5"
          />
          <span className="text-sm leading-relaxed">
            Я ознакомлен(а) с{" "}
            <Link href="/legal/scan-policy" target="_blank" rel="noopener" className="underline text-primary">
              Политикой использования сервиса анализа лица
            </Link>
            . Фото не сохраняются и не используются для идентификации.
          </span>
        </label>
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-lg"
        disabled={!canStart || loading}
        aria-describedby={!canStart ? "consent-hint" : undefined}
        onClick={handleStart}
      >
        {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
        Начать
      </Button>
      {!canStart && (
        <p id="consent-hint" className="text-xs text-muted-foreground text-center">
          Подтвердите согласие с обеими политиками
        </p>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense>
      <ScanPageContent />
    </Suspense>
  );
}
