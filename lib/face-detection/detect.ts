import type {
  FaceLandmarksDetector,
  Keypoint,
} from "@tensorflow-models/face-landmarks-detection";

let detectorPromise: Promise<FaceLandmarksDetector> | null = null;

export async function loadDetector(): Promise<FaceLandmarksDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const [tfCore, , faceLandmarksDetection] = await Promise.all([
        import("@tensorflow/tfjs-core"),
        import("@tensorflow/tfjs-backend-webgl"),
        import("@tensorflow-models/face-landmarks-detection"),
      ]);
      await tfCore.ready();

      return faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: true,
          maxFaces: 1,
        }
      );
    })();
  }
  return detectorPromise;
}

export async function detectLandmarks(
  img: HTMLImageElement
): Promise<Keypoint[] | null> {
  const detector = await loadDetector();

  // Resize to 640px max side on a canvas for consistent inference performance
  const canvas = document.createElement("canvas");
  const MAX = 640;
  const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const faces = await detector.estimateFaces(canvas, {
    flipHorizontal: false,
  });

  if (!faces.length || !faces[0]?.keypoints) return null;
  return faces[0].keypoints;
}
