import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tensorflow/tfjs-backend-webgl",
    "@tensorflow-models/face-landmarks-detection",
  ],
};

export default nextConfig;
