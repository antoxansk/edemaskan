"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useScan } from "@/components/scan/scan-provider";

const WIDGET_SCRIPT_ID = "873daee45f3b2bb4cbc8600bec9180aede157f00";
const WIDGET_SCRIPT_SRC =
  "https://xn--j1amdg6b.xn----7sbhdegumjf0agbb9c1e.xn--p1ai/pl/lite/widget/script?id=1610554";

export default function EmailPage() {
  const router = useRouter();
  const { aiResult } = useScan();
  const [redFlag, setRedFlag] = useState(false);
  const capturedRef = useRef<{ name: string; email: string }>({ name: "", email: "" });

  useEffect(() => {
    const token = sessionStorage.getItem("edm_result_token");
    if (!token) { router.replace("/scan"); return; }

    const stored = sessionStorage.getItem("edm_ai_result");
    const result = aiResult ?? (stored ? JSON.parse(stored) : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (result?.red_flag) setRedFlag(true);
  }, [router, aiResult]);

  async function handleWidgetSuccess(name: string, email: string) {
    const sessionToken = sessionStorage.getItem("edm_session_token");
    const resultToken  = sessionStorage.getItem("edm_result_token");

    if (name) sessionStorage.setItem("edm_user_name", name);

    // Fire-and-forget to our API for DB tracking + Telegram alert
    if (sessionToken && resultToken && name && email) {
      fetch("/api/scan/submit-email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ session_token: sessionToken, result_token: resultToken, name, email }),
        keepalive: true,
      }).catch(() => {});
    }

    router.push("/scan/result");
  }

  useEffect(() => {
    // Capture form data before the widget submits it
    function onSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      const data = new FormData(form);
      const name =
        (data.get("name") as string) ||
        (data.get("user[name]") as string) ||
        (data.get("lname") as string) || "";
      const email =
        (data.get("email") as string) ||
        (data.get("user[email]") as string) || "";
      capturedRef.current = { name: name.trim(), email: email.trim() };
    }

    // GetCourse lite widget fires postMessage on successful submission
    function onMessage(e: MessageEvent) {
      try {
        const d = e.data as Record<string, unknown> | null;
        if (!d || typeof d !== "object") return;
        const isSuccess =
          d.type === "lp_form_sent" ||
          d.type === "form_sent" ||
          d.action === "formSent" ||
          d.event === "form_sent" ||
          d.status === "success";
        if (isSuccess) {
          const { name, email } = capturedRef.current;
          void handleWidgetSuccess(name, email);
        }
      } catch { /* ignore */ }
    }

    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("message", onMessage);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("message", onMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Готово!</h1>
        <p className="text-muted-foreground text-sm">
          Введите данные, чтобы открыть разбор
        </p>
      </div>

      {redFlag && (
        <Alert variant="destructive">
          <AlertTriangle size={16} />
          <AlertDescription className="text-sm">
            На фото есть признаки, которые требуют внимания врача. Подробности — после ввода данных.
          </AlertDescription>
        </Alert>
      )}

      {/* GetCourse lite widget renders here */}
      <Script
        id={WIDGET_SCRIPT_ID}
        src={WIDGET_SCRIPT_SRC}
        strategy="afterInteractive"
      />

      <p className="text-xs text-muted-foreground text-center">
        Мы продублируем разбор на вашу почту. Email не передаём третьим лицам, отписаться можно в один клик.
      </p>
    </div>
  );
}
