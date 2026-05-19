"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ResultView } from "@/components/scan/result-view";
import { useScan } from "@/components/scan/scan-provider";
import { ymGoal } from "@/lib/ym";
import type { AiResultType } from "@/lib/validation";

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-[480px] mx-auto px-4 py-6 w-full animate-pulse">
      <div className="flex flex-col items-center gap-3 pt-6">
        <div className="w-5 h-5 rounded-full bg-border" />
        <div className="h-9 bg-border rounded-2xl w-3/4" />
        <div className="h-5 bg-border rounded-xl w-1/2" />
      </div>
      <div className="rounded-3xl bg-border" style={{ aspectRatio: "3/4" }} />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 rounded-full bg-border" style={{ width: `${64 + i * 10}px` }} />
        ))}
      </div>
      <div className="rounded-3xl bg-border h-48" />
      <div className="rounded-2xl bg-border h-28" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-border h-32" />
      ))}
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { aiResult, photos } = useScan();
  const frontalPhoto = photos.find((p) => p.slot === "frontal")?.previewUrl ?? null;

  const [result, setResult] = useState<AiResultType | null>(aiResult);
  const [name, setName] = useState<string | null>(null);
  const [loading, setLoading] = useState(!aiResult);
  const [errorType, setErrorType] = useState<"error" | "expired" | null>(null);

  useEffect(() => {
    const resultToken = sessionStorage.getItem("edm_result_token");
    if (!resultToken) {
      router.replace("/scan");
      return;
    }

    // Restore name entered on email screen
    const storedName = sessionStorage.getItem("edm_user_name");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedName) setName(storedName);

    // aiResult is already in state via useState(aiResult) initial value
    if (aiResult) return;

    const stored = sessionStorage.getItem("edm_ai_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored) as AiResultType);
        setLoading(false);
        return;
      } catch {
        /* fall through to API */
      }
    }

    void (async () => {
      try {
        const res = await fetch(`/api/result/${resultToken}`);
        const data = (await res.json()) as {
          success?: boolean;
          ai_result?: AiResultType;
          name?: string;
        };
        if (res.ok && data.success) {
          setResult(data.ai_result ?? null);
          setName(data.name ?? null);
        } else if (res.status === 404) {
          setErrorType("expired");
        } else {
          setErrorType("error");
        }
      } catch {
        setErrorType("error");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, aiResult]);

  useEffect(() => {
    if (result) ymGoal("result_view", { red_flag: result.red_flag ? "1" : "0" });
  }, [result]);

  if (loading) return <ResultSkeleton />;

  if (errorType === "expired") {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-12 text-center w-full">
        <div className="rounded-2xl border border-border p-6 bg-bg-card shadow-soft">
          <p className="text-[17px] text-foreground mb-2 font-semibold">
            Этот разбор больше недоступен
          </p>
          <p className="text-sm text-text-muted mb-5">
            Разборы хранятся 30 дней. Получите новый бесплатный анализ.
          </p>
          <Link
            href="/morning-face"
            className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-primary text-text-inverse font-semibold cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Новый разбор
          </Link>
        </div>
      </div>
    );
  }

  if (errorType === "error" || !result) {
    return (
      <div className="max-w-[480px] mx-auto px-4 py-12 text-center w-full">
        <div className="rounded-2xl border border-border p-6 bg-bg-card shadow-soft">
          <p className="text-[17px] text-foreground mb-2 font-semibold">
            Не удалось загрузить результат
          </p>
          <p className="text-sm text-text-muted mb-5">
            Попробуйте обновить страницу или напишите нам в Telegram @edemaskan_help
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-12 px-8 rounded-full bg-primary text-text-inverse font-semibold cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Обновить
          </button>
        </div>
      </div>
    );
  }

  return <ResultView name={name} result={result} frontalPhotoUrl={frontalPhoto} />;
}
