"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ResultView } from "@/components/scan/result-view";
import { useScan } from "@/components/scan/scan-provider";
import type { AiResultType } from "@/lib/validation";

export default function ResultPage() {
  const router   = useRouter();
  const { aiResult, photos } = useScan();
  const frontalPhoto = photos.find((p) => p.slot === "frontal")?.previewUrl ?? null;
  const [result, setResult]     = useState<AiResultType | null>(aiResult);
  const [name, setName]         = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading]   = useState(!aiResult);

  useEffect(() => {
    const resultToken = sessionStorage.getItem("edm_result_token");
    if (!resultToken) {
      router.replace("/scan");
      return;
    }

    // Use context result if available
    if (aiResult) {
      setResult(aiResult);
      setExpiresAt(sessionStorage.getItem("edm_expires_at"));
      setLoading(false);
      return;
    }

    // Fallback: try stored ai_result
    const stored = sessionStorage.getItem("edm_ai_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored) as AiResultType);
        setExpiresAt(sessionStorage.getItem("edm_expires_at"));
        setLoading(false);
        return;
      } catch { /* fall through to API */ }
    }

    // Fetch from API
    void (async () => {
      try {
        const res = await fetch(`/api/result/${resultToken}`);
        const data = (await res.json()) as {
          success?: boolean;
          ai_result?: AiResultType;
          name?: string;
          special_price_expires_at?: string;
        };
        if (res.ok && data.success) {
          setResult(data.ai_result ?? null);
          setName(data.name ?? null);
          setExpiresAt(data.special_price_expires_at ?? null);
        } else {
          router.replace("/scan");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router, aiResult]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!result) return null;

  return <ResultView name={name} result={result} expiresAt={expiresAt} frontalPhotoUrl={frontalPhoto} />;
}
