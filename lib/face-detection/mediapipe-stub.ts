// Stub for @mediapipe/face_mesh — satisfies Turbopack's static analysis.
// face-landmarks-detection's ESM bundle imports this unconditionally, but
// the MediaPipe code path is never executed (we use runtime: "tfjs").
/* eslint-disable @typescript-eslint/no-unused-vars */

export class FaceMesh {
  setOptions(): void {}
  onResults(): void {}
  send(): Promise<void> { return Promise.resolve(); }
  close(): void {}
}

export const FACEMESH_TESSELATION: unknown[] = [];
export const FACEMESH_RIGHT_EYE: unknown[] = [];
export const FACEMESH_RIGHT_EYEBROW: unknown[] = [];
export const FACEMESH_LEFT_EYE: unknown[] = [];
export const FACEMESH_LEFT_EYEBROW: unknown[] = [];
export const FACEMESH_FACE_OVAL: unknown[] = [];
export const FACEMESH_LIPS: unknown[] = [];
export const FACEMESH_RIGHT_IRIS: unknown[] = [];
export const FACEMESH_LEFT_IRIS: unknown[] = [];
export const VERSION = "0.0.0-stub";
