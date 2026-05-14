"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { AiResultType } from "@/lib/validation";

export type PhotoSlot = "frontal" | "three_quarter_left" | "three_quarter_right" | "tilted_down";

type PhotoEntry = {
  slot:       PhotoSlot;
  file:       File;
  previewUrl: string;
  sizeBytes:  number;
};

type ScanContextType = {
  photos:      PhotoEntry[];
  setPhoto:    (slot: PhotoSlot, file: File, previewUrl: string, sizeBytes: number) => void;
  removePhoto: (slot: PhotoSlot) => void;
  aiResult:    AiResultType | null;
  setAiResult: (r: AiResultType) => void;
};

const ScanContext = createContext<ScanContextType | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [aiResult, setAiResultState] = useState<AiResultType | null>(null);

  const setPhoto = useCallback(
    (slot: PhotoSlot, file: File, previewUrl: string, sizeBytes: number) => {
      setPhotos((prev) => {
        const next = prev.filter((p) => p.slot !== slot);
        next.push({ slot, file, previewUrl, sizeBytes });
        return next;
      });
    },
    [],
  );

  const removePhoto = useCallback((slot: PhotoSlot) => {
    setPhotos((prev) => prev.filter((p) => p.slot !== slot));
  }, []);

  const setAiResult = useCallback((r: AiResultType) => {
    setAiResultState(r);
  }, []);

  return (
    <ScanContext.Provider value={{ photos, setPhoto, removePhoto, aiResult, setAiResult }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan(): ScanContextType {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used inside ScanProvider");
  return ctx;
}
