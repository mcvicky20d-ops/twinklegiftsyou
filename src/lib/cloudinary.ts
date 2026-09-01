/**
 * Unsigned Cloudinary uploads: the browser posts straight to Cloudinary, so no
 * API secret ever reaches the client and the free tier is enough for a gift shop.
 * Without the env vars the admin forms fall back to pasting an image URL.
 */
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "",
};

export function cloudinaryEnabled() {
  return Boolean(cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset);
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!cloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured.");
  }
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", cloudinaryConfig.uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new Error("Upload failed. Check the Cloudinary upload preset is unsigned.");
  }
  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}
