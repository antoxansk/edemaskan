import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tensorflow/tfjs-backend-webgl",
    "@tensorflow-models/face-landmarks-detection",
  ],
  turbopack: {
    resolveAlias: {
      // @mediapipe/face_mesh is unconditionally imported by face-landmarks-detection's
      // ESM bundle but never executed (we use runtime: "tfjs"). Stub it out to prevent
      // Turbopack from failing on its non-ESM IIFE bundle.
      "@mediapipe/face_mesh": "./lib/face-detection/mediapipe-stub.ts",
    },
  },
};

export default nextConfig;
