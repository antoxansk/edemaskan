"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Loader2, Smartphone, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useScan, type PhotoSlot } from "@/components/scan/scan-provider";
import { compressPhoto, validatePhotoSize } from "@/lib/photo-compression";

const POSE_IMAGES: Record<PhotoSlot, string> = {
  frontal:             "/poses/frontal.png",
  three_quarter_left:  "/poses/three-quarter-left.png",
  three_quarter_right: "/poses/three-quarter-right.png",
  tilted_down:         "/poses/tilted-down.png",
};

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
        className="relative w-full aspect-3/4 rounded-2xl border border-border overflow-hidden transition-opacity hover:opacity-90"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.previewUrl} alt={label} className="w-full h-full object-cover" />
        ) : compressing ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/30">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={POSE_IMAGES[slot]}
              alt={label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 via-black/25 to-transparent pt-10 pb-3 px-3">
              <p className="text-white font-semibold text-sm text-center leading-snug">{label}</p>
              <p className="text-white/80 text-xs text-center mt-0.5">{hint}</p>
            </div>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDesktop(noCamera || bigScreen);
  }, [router]);

  // Preload pose illustrations so they appear instantly
  useEffect(() => {
    Object.values(POSE_IMAGES).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  const frontalPreviewUrl = photos.find((p) => p.slot === "frontal")?.previewUrl ?? null;
  const allPhotosCount = photos.length;

  // As soon as all 4 photos are ready, fire-and-forget TF.js face detection.
  // Result is cached in sessionStorage so the result page shows contours in 1-2s.
  useEffect(() => {
    if (allPhotosCount < 4 || !frontalPreviewUrl) return;

    const photoUrl = frontalPreviewUrl;
    try { sessionStorage.removeItem("edm_landmarks_v2"); } catch { /* ignore */ }

    void (async () => {
      try {
        const { loadDetector, detectLandmarks } = await import("@/lib/face-detection/detect");
        await loadDetector();
        const img = new window.Image();
        img.src = photoUrl;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        const kps = await detectLandmarks(img);
        if (kps) sessionStorage.setItem("edm_landmarks_v2", JSON.stringify(kps));
      } catch { /* silent fail — result page will detect on its own */ }
    })();
    // No cleanup — intentionally continues across navigation to questionnaire
  }, [allPhotosCount, frontalPreviewUrl]);

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

      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 border border-emerald-100">
        <Shield size={14} className="shrink-0" />
        <span>Фото не сохраняются — обрабатываются в памяти и удаляются после анализа</span>
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
        className="w-full h-14 text-lg font-bold btn-emerald-cta"
        disabled={!allDone}
        onClick={() => router.push("/scan/questionnaire")}
      >
        Продолжить
      </Button>
    </div>
  );
}
