"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

function DesktopFallbackContent() {
  const params   = useSearchParams();
  const scenario = params.get("from") ?? "morning-face";
  const [scanUrl, setScanUrl] = useState("");

  useEffect(() => {
    // Use actual current origin so the QR always points to the live server
    setScanUrl(`${window.location.origin}/scan?from=${scenario}`);
  }, [scenario]);

  return (
    <div className="flex flex-col items-center gap-6 text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Smartphone size={32} className="text-primary" />
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-2">Удобнее с телефона</h1>
        <p className="text-sm text-muted-foreground">Наведите камеру телефона на QR-код, чтобы продолжить</p>
      </div>

      <div className="w-48 h-48 rounded-2xl border-2 border-border bg-white flex items-center justify-center p-3">
        {scanUrl ? <QRCodeSVG value={scanUrl} size={168} level="M" /> : null}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button asChild variant="outline">
          <Link href={`/scan?from=${scenario}&desktop=1`}>
            Продолжить на компьютере (загрузить файлы)
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/scan?from=${scenario}`}>
            Я уже на телефоне
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function DesktopFallbackPage() {
  return (
    <Suspense>
      <DesktopFallbackContent />
    </Suspense>
  );
}
