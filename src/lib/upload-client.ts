import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, formatBytes } from "@/lib/customisation";

/**
 * Two hops: ask the server for a one-time URL, then send the file straight to
 * storage. Going through the app instead would hit the serverless request body
 * limit well below the 5MB the shop allows.
 */
export async function uploadCustomerPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That is not an image file.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `${formatBytes(file.size)} is too large. Please keep photos under ${MAX_UPLOAD_LABEL} — a phone photo is usually fine.`,
    );
  }

  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });

  if (!signResponse.ok) {
    const { error } = (await signResponse.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? "Could not start the upload.");
  }

  const { signedUrl, publicUrl } = (await signResponse.json()) as {
    signedUrl: string;
    publicUrl: string;
  };

  const upload = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!upload.ok) {
    throw new Error("The upload did not complete. Please try again.");
  }

  return publicUrl;
}
