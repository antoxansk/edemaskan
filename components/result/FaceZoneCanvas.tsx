"use client";

import { useRef, useEffect, useState } from "react";
import type { Keypoint } from "@tensorflow-models/face-landmarks-detection";
import type { ZoneKey } from "@/lib/face-detection/zones";
import { FACE_ZONES, ZONE_ORDER } from "@/lib/face-detection/zones";
import {
  scaleLandmarks,
  buildZonePolygons,
  getNeckPolygon,
} from "@/lib/face-detection/utils";
import type { AiResultType } from "@/lib/validation";

type Props = {
  imageUrl: string;
  keypoints: Keypoint[];
  activeZone: ZoneKey | null;
  zones: NonNullable<AiResultType["zone_analysis"]>;
  onZoneClick?: (zone: ZoneKey) => void;
};

export function FaceZoneCanvas({
  imageUrl,
  keypoints,
  activeZone,
  zones,
  onZoneClick,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState<{
    displayW: number;
    displayH: number;
    naturalW: number;
    naturalH: number;
  } | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const update = () => {
      if (img.naturalWidth > 0) {
        setImgDims({
          displayW: img.offsetWidth,
          displayH: img.offsetHeight,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        });
      }
    };

    if (img.complete) update();
    img.addEventListener("load", update);
    const ro = new ResizeObserver(update);
    ro.observe(img);

    return () => {
      img.removeEventListener("load", update);
      ro.disconnect();
    };
  }, []);

  // Visible zones from AI analysis
  const visibleZones = ZONE_ORDER.filter((k) => {
    const z = zones[k];
    return z?.visible && z?.intensity && z.intensity !== "none";
  });

  // Build scaled points when image dimensions are known
  const scaled = imgDims
    ? scaleLandmarks(
        keypoints,
        imgDims.displayW / (imgDims.naturalW || imgDims.displayW),
        imgDims.displayH / (imgDims.naturalH || imgDims.displayH)
      )
    : null;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border bg-bg-elevated" style={{ aspectRatio: "3/4" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Ваше фото для анализа зон"
        className="w-full h-full object-cover"
        loading="eager"
        crossOrigin="anonymous"
      />

      {scaled && imgDims && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={imgDims.displayW}
          height={imgDims.displayH}
          aria-hidden="true"
        >
          <defs>
            <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {visibleZones.map((zone) => {
            const isActive = activeZone === zone;
            const color = FACE_ZONES[zone].color;
            const polygons =
              zone === "neck"
                ? [{ points: getNeckPolygon(scaled, imgDims.displayH), key: "neck" }]
                : buildZonePolygons(zone, scaled);

            return polygons.map(({ points, key }) =>
              points ? (
                <polygon
                  key={key}
                  points={points}
                  fill={color}
                  fillOpacity={isActive ? 0.35 : 0.15}
                  stroke={color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  filter={isActive ? "url(#zone-glow)" : undefined}
                  style={{
                    transition: prefersReducedMotion
                      ? "none"
                      : "fill-opacity 300ms ease, stroke-width 300ms ease",
                    pointerEvents: "all",
                    cursor: onZoneClick ? "pointer" : "default",
                  }}
                  onClick={() => onZoneClick?.(zone)}
                />
              ) : null
            );
          })}
        </svg>
      )}
    </div>
  );
}
