"use client";

export const MAX_PHOTO_BASE64_BYTES = 800 * 1024;

export type CompressedPhoto = {
  file:      File;
  dataUrl:   string;
  sizeBytes: number;
};

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const { default: imageCompression } = await import("browser-image-compression");

  const compressed = await imageCompression(file, {
    maxSizeMB:        0.5,
    maxWidthOrHeight: 1024,
    useWebWorker:     true,
    fileType:         "image/jpeg",
    initialQuality:   0.82,
  });

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(compressed);
  });

  return { file: compressed, dataUrl, sizeBytes: Math.round(dataUrl.length * 0.75) };
}

export function validatePhotoSize(photo: CompressedPhoto): boolean {
  return photo.sizeBytes <= MAX_PHOTO_BASE64_BYTES;
}
