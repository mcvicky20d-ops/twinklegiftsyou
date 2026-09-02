import "server-only";
import { createClient } from "@supabase/supabase-js";
import { MAX_UPLOAD_BYTES } from "@/lib/customisation";

export const PHOTO_BUCKET = "customer-photos";
/** Supabase's free tier ships 1 GB of file storage. */
export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export function storageEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Service-role client. Never import this from a client component — the key it
 * carries bypasses row-level security.
 */
function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export function publicPhotoUrl(path: string) {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/**
 * Mints a short-lived URL the browser uploads straight to. The file never
 * passes through this app, which sidesteps the serverless request body limit,
 * and no storage credential reaches the browser.
 */
export async function createPhotoUpload(contentType: string) {
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { error: "Please choose a JPG, PNG, WEBP or HEIC image." } as const;
  }

  const extension = contentType.split("/")[1].replace("jpeg", "jpg");
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;

  const { data, error } = await admin().storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("Could not create signed upload URL", error);
    return { error: "Uploads are unavailable right now. Please try again." } as const;
  }

  return { signedUrl: data.signedUrl, path: data.path, publicUrl: publicPhotoUrl(path) } as const;
}

export type StoredPhoto = {
  path: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
};

/**
 * Photos are stored under date folders, so listing walks one level down.
 * The bucket holds one small shop's reference photos, not a media library, so
 * a full walk is cheaper than maintaining a separate index.
 */
export async function listPhotos(): Promise<StoredPhoto[]> {
  const client = admin();
  const { data: folders, error } = await client.storage
    .from(PHOTO_BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "desc" } });

  if (error || !folders) {
    console.error("Could not list photo folders", error);
    return [];
  }

  const photos: StoredPhoto[] = [];
  for (const folder of folders) {
    // A file at the root has metadata; a folder does not.
    if (folder.metadata) {
      photos.push({
        path: folder.name,
        name: folder.name,
        url: publicPhotoUrl(folder.name),
        size: Number(folder.metadata.size ?? 0),
        createdAt: folder.created_at ?? "",
      });
      continue;
    }

    const { data: files } = await client.storage
      .from(PHOTO_BUCKET)
      .list(folder.name, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

    for (const file of files ?? []) {
      if (!file.metadata) continue;
      const path = `${folder.name}/${file.name}`;
      photos.push({
        path,
        name: file.name,
        url: publicPhotoUrl(path),
        size: Number(file.metadata.size ?? 0),
        createdAt: file.created_at ?? "",
      });
    }
  }

  return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deletePhoto(path: string) {
  const { error } = await admin().storage.from(PHOTO_BUCKET).remove([path]);
  if (error) {
    console.error("Could not delete photo", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const };
}

export const uploadLimits = { maxBytes: MAX_UPLOAD_BYTES, allowedTypes: ALLOWED_TYPES };
