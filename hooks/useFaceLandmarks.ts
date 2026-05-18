"use client";

import { useEffect, useRef, useState } from "react";
import type { Keypoint } from "@tensorflow-models/face-landmarks-detection";

export type LandmarkStatus = "idle" | "loading" | "done" | "error" | "no-face";

const CACHE_KEY = "edm_landmarks";

export function useFaceLandmarks(imageUrl: string | null): {
  keypoints: Keypoint[] | null;
  status: LandmarkStatus;
  errorMessage: string | null;
} {
  const [keypoints, setKeypoints] = useState<Keypoint[] | null>(null);
  const [status, setStatus] = useState<LandmarkStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!imageUrl) return;

    abortRef.current = false;

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Keypoint[];
        window.setTimeout(() => {
          setKeypoints(parsed);
          setStatus("done");
        }, 0);
        return;
      }
    } catch {
      // ignore parse errors
    }

    window.setTimeout(() => setStatus("loading"), 0);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      if (abortRef.current) return;
      try {
        const { detectLandmarks } = await import(
          "@/lib/face-detection/detect"
        );
        const kps = await detectLandmarks(img);
        if (abortRef.current) return;

        if (!kps) {
          setStatus("no-face");
          return;
        }

        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(kps));
        } catch {
          // sessionStorage full — proceed without caching
        }

        setKeypoints(kps);
        setStatus("done");
      } catch (err) {
        if (abortRef.current) return;
        console.error("[useFaceLandmarks] detection failed:", err);
        setErrorMessage(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    };

    img.onerror = () => {
      if (abortRef.current) return;
      setErrorMessage("Не удалось загрузить изображение");
      setStatus("error");
    };

    img.src = imageUrl;

    return () => {
      abortRef.current = true;
    };
  }, [imageUrl]);

  return { keypoints, status, errorMessage };
}
