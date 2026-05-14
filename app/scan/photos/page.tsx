"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, RefreshCw, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useScan, type PhotoSlot } from "@/components/scan/scan-provider";
import { compressPhoto, validatePhotoSize } from "@/lib/photo-compression";

const SLOTS: { slot: PhotoSlot; label: string; hint: string }[] = [
  { slot: "frontal",             label: "Анфас",         hint: "Смотрите прямо в камеру" },
  { slot: "three_quarter_left",  label: "Поворот влево", hint: "Повернитесь на 45° влево" },
  { slot: "three_quarter_right", label: "Поворот вправо",hint: "Повернитесь на 45° вправо" },
  { slot: "tilted_down",         label: "Взгляд вниз",   hint: "Наклоните голову вниз" },
];

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_RAW_BYTES  = 15 * 1024 * 1024;

function PhotoCard({
  slot, label, hint, photo, isDesktop,
  onSelect, onRemove,
}: {
  slot:       PhotoSlot;
  label:      string;
  hint:       string;
  photo?:     { previewUrl: string };
  isDesktop:  boolean;
  onSelect:   (slot: PhotoSlot, file: File) => Promise<void>;
  onRemove:   (slot: PhotoSlot) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  async function handleFile(file: File) {
    if (file.size > MAX_RAW_BYTES) {
      toast.error("Файл слишком большой. Попробуйте другой.");
      return;
    }
    setCompressing(true);
    try {
      await onSelect(slot, file);
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 transition-colors hover:border-primary hover:bg-muted/50 overflow-hidden"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.previewUrl} alt={label} className="w-full h-full object-cover" />
        ) : compressing ? (
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        ) : (
          <>
            <Camera size={28} className="text-muted-foreground" />
            <span className="text-xs font-medium text-center px-2">{label}</span>
            <span className="text-xs text-muted-foreground text-center px-2">{hint}</span>
          </>
        )}
      </button>

      {photo && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => onRemove(slot)}
        >
          <RefreshCw size={14} className="mr-1" /> Переснять
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        capture={isDesktop ? undefined : "user"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function PhotosPage() {
  const router  = useRouter();
  const { photos, setPhoto, removePhoto } = useScan();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Redirect if no session
    const token = sessionStorage.getItem("edm_session_token");
    if (!token) {
      router.replace("/scan");
      return;
    }
    // Detect desktop (no camera API)
    const noCamera = !navigator.mediaDevices?.getUserMedia;
    const bigScreen = window.innerWidth >= 1024;
    setIsDesktop(noCamera || bigScreen);
  }, [router]);

  const photoMap = Object.fromEntries(photos.map((p) => [p.slot, p]));
  const allDone  = SLOTS.every(({ slot }) => slot in photoMap);

  async function handleSelect(slot: PhotoSlot, file: File) {
    const compressed = await compressPhoto(file);
    if (!validatePhotoSize(compressed)) {
      toast.error("Фото слишком большое после сжатия. Попробуйте другое.");
      return;
    }
    setPhoto(slot, compressed.file, compressed.dataUrl, compressed.sizeBytes);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Сделайте 4 фото лица</h1>
        <p className="text-sm text-muted-foreground">При хорошем освещении, без теней, фильтров и очков</p>
      </div>

      {isDesktop && (
        <Alert>
          <Smartphone size={16} />
          <AlertDescription className="text-sm">
            Удобнее с телефона. <button onClick={() => router.push("/scan/desktop-fallback")} className="underline font-medium">Получить QR-код</button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map(({ slot, label, hint }) => (
          <PhotoCard
            key={slot}
            slot={slot}
            label={label}
            hint={hint}
            photo={photoMap[slot]}
            isDesktop={isDesktop}
            onSelect={handleSelect}
            onRemove={removePhoto}
          />
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!allDone}
        onClick={() => router.push("/scan/questionnaire")}
      >
        Продолжить
      </Button>
    </div>
  );
}
