import type { Keypoint } from "@tensorflow-models/face-landmarks-detection";
import type { ZoneKey } from "./zones";
import { FACE_ZONES } from "./zones";

export type Point = { x: number; y: number };

/** Scale landmarks (in natural image pixels) to display size */
export function scaleLandmarks(
  keypoints: Keypoint[],
  scaleX: number,
  scaleY: number
): Point[] {
  return keypoints.map((kp) => ({
    x: kp.x * scaleX,
    y: kp.y * scaleY,
  }));
}

/** Build an SVG polygon points string from a list of indices into scaled points */
export function indicesToPolygonPoints(
  scaled: Point[],
  indices: number[]
): string {
  return indices
    .map((i) => {
      const pt = scaled[i];
      return pt ? `${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : null;
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Build SVG <polygon points="..."> strings for a zone.
 * Returns one or more polygon definitions (left/right halves or single).
 */
export function buildZonePolygons(
  zone: ZoneKey,
  scaled: Point[]
): { points: string; key: string }[] {
  const def = FACE_ZONES[zone];
  const { indices } = def;

  if (Array.isArray(indices)) {
    return [{ points: indicesToPolygonPoints(scaled, indices), key: zone }];
  }

  const result: { points: string; key: string }[] = [];
  const leftPts = indicesToPolygonPoints(scaled, indices.left);
  if (leftPts) result.push({ points: leftPts, key: `${zone}-left` });
  const rightPts = indicesToPolygonPoints(scaled, indices.right);
  if (rightPts) result.push({ points: rightPts, key: `${zone}-right` });
  if (indices.extra) {
    const extraPts = indicesToPolygonPoints(scaled, indices.extra);
    if (extraPts) result.push({ points: extraPts, key: `${zone}-extra` });
  }

  return result;
}

/**
 * Compute a neck polygon geometrically from chin landmark (152)
 * and face width. Extends downward by ~30% of face height.
 */
export function getNeckPolygon(
  scaled: Point[],
  displayHeight: number
): string {
  const chin = scaled[152];
  const leftJaw = scaled[234];
  const rightJaw = scaled[454];

  if (!chin || !leftJaw || !rightJaw) return "";

  const faceWidth = Math.abs(rightJaw.x - leftJaw.x);
  const neckHalfWidth = faceWidth * 0.22;
  const neckBottom = Math.min(chin.y + displayHeight * 0.12, displayHeight);

  const pts = [
    { x: chin.x - neckHalfWidth, y: chin.y },
    { x: chin.x + neckHalfWidth, y: chin.y },
    { x: chin.x + neckHalfWidth * 0.85, y: neckBottom },
    { x: chin.x - neckHalfWidth * 0.85, y: neckBottom },
  ];

  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}
