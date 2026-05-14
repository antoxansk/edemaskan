"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export default function DesktopFallbackPage() {
  const params   = useSearchParams();
  const scenario = params.get("from") ?? "morning-face";
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://edemaskan.lid.nutritionist4day.ru";
  const scanUrl  = `${siteUrl}/scan?from=${scenario}`;

  return (
    <div className="flex flex-col items-center gap-6 text-center py-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Smartphone size={32} className="text-primary" />
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-2">Удобнее с телефона</h1>
        <p className="text-sm text-muted-foreground">Наведите камеру телефона на QR-код, чтобы продолжить</p>
      </div>

      {/* QR placeholder — qrcode.react will be added when installed */}
      <div className="w-48 h-48 rounded-2xl border-2 border-border bg-muted flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-3">
          QR: {scanUrl}
        </p>
      </div>

      <p className="text-xs text-muted-foreground max-w-xs">{scanUrl}</p>

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
