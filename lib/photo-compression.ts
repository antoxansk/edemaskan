"use client";

// Max base64 size per photo before rejecting (SPEC §5.4: 800 KB)
export const MAX_PHOTO_BASE64_BYTES = 800 * 1024;

export type CompressedPhoto = {
  dataUrl:  string;
  sizeBytes: number;
};

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const { default: imageCompression } = await import("browser-image-compression");

  const compressed = await imageCompression(file, {
    maxSizeMB:            0.5,   // 500 KB max
    maxWidthOrHeight:     1024,
    useWebWorker:         true,
    fileType:             "image/jpeg",
    initialQuality:       0.85,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({ dataUrl, sizeBytes: Math.round(dataUrl.length * 0.75) });
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(compressed);
  });
}

export function validatePhotoSize(photo: CompressedPhoto): boolean {
  return photo.sizeBytes <= MAX_PHOTO_BASE64_BYTES;
}
