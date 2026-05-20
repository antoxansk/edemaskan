"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScan } from "@/components/scan/scan-provider";
import type { AiResultType } from "@/lib/validation";

const MESSAGES = [
  "Анализирую зоны лица...",
  "Сопоставляю с ответами опросника...",
  "Подбираю стартовый план...",
  "Готовлю персональный разбор...",
];

const MAX_RETRIES = 3;

export default function AnalyzingPage() {
  const router   = useRouter();
  const { photos, setAiResult } = useScan();

  const [msgIndex, setMsgIndex]   = useState(0);
  const [elapsed, setElapsed]     = useState(0);
  const [attempt, setAttempt]     = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const controllerRef = useRef<AbortController | null>(null);
  const elapsedRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    setElapsed(0);

    // Read session from storage
    const sessionToken = sessionStorage.getItem("edm_session_token");
    const answersRaw   = sessionStorage.getItem("edm_answers");

    if (!sessionToken || !answersRaw || photos.length < 4) {
      router.replace("/scan");
      return;
    }

    // Start elapsed timer
    elapsedRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

    const controller = new AbortController();
    controllerRef.current = controller;
    // Auto-abort after 70s so the user gets an error instead of infinite spinner
    const autoAbortTimer = setTimeout(() => controller.abort(), 70_000);

    try {
      const fd = new FormData();
      fd.append("session_token", sessionToken);
      fd.append("answers", answersRaw);

      const slotToKey: Record<string, string> = {
        frontal:             "photo_frontal",
        three_quarter_left:  "photo_three_quarter_left",
        three_quarter_right: "photo_three_quarter_right",
        tilted_down:         "photo_tilted_down",
      };

      for (const p of photos) {
        const key = slotToKey[p.slot];
        if (key) fd.append(key, p.file, `${p.slot}.jpg`);
      }

      const res = await fetch("/api/scan/analyze", {
        method: "POST",
        body:   fd,
        signal: controller.signal,
      });

      const data = (await res.json()) as {
        success?: boolean;
        result_token?: string;
        ai_result?: AiResultType;
        error?: { code: string; message: string };
      };

      if (!res.ok || !data.success) {
        setError(data.error?.message ?? "Анализ временно недоступен. Попробуйте через 1-2 минуты.");
        return;
      }

      // Store result
      sessionStorage.setItem("edm_result_token", data.result_token!);
      sessionStorage.setItem("edm_ai_result", JSON.stringify(data.ai_result));
      setAiResult(data.ai_result!);

      router.push("/scan/email");
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== "AbortError") {
        setError("Анализ временно недоступен. Попробуйте через 1-2 минуты.");
      }
    } finally {
      clearTimeout(autoAbortTimer);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    // Rotate messages
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runAnalysis();
    setAttempt(1);
    return () => {
      controllerRef.current?.abort();
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retry() {
    const next = attempt + 1;
    setAttempt(next);
    void runAnalysis();
  }

  const circumference = 2 * Math.PI * 44;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6 text-center pt-12">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-destructive" />
        </div>
        <div>
          <p className="font-semibold mb-2">Что-то пошло не так</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>

        {attempt < MAX_RETRIES ? (
          <Button onClick={retry} variant="outline" className="gap-2">
            <RefreshCw size={16} /> Попробовать снова ({attempt}/{MAX_RETRIES})
          </Button>
        ) : null}

        <a
          href={`mailto:support@updn.pro?subject=Edemaskan: ошибка анализа`}
          className="text-sm text-muted-foreground underline"
        >
          Связаться с поддержкой
        </a>
      </div>
    );
  }

  const countdown = Math.max(0, 60 - elapsed);

  return (
    <div className="flex flex-col items-center gap-6 text-center pt-8">
      {/* Countdown */}
      <div className="text-4xl font-bold tabular-nums text-primary">
        {countdown}
        <span className="text-lg font-normal text-muted-foreground ml-1">с</span>
      </div>

      <div className="relative w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100"
          style={{ animation: "spin 3s linear infinite" }}>
          <circle cx="50" cy="50" r="44" className="fill-none stroke-muted" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44"
            className="fill-none stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
      </div>

      <div className="min-h-[3rem]">
        <p className="text-lg font-medium transition-all duration-500">{MESSAGES[msgIndex]}</p>
      </div>

      {elapsed >= 60 && analyzing && (
        <Button variant="outline" onClick={retry} className="gap-2">
          <RefreshCw size={16} /> Что-то долго... Попробовать снова
        </Button>
      )}
    </div>
  );
}
