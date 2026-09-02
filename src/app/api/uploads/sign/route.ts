import { NextResponse } from "next/server";
import { createPhotoUpload, storageEnabled, uploadLimits } from "@/lib/storage";

/**
 * Public by necessity — customers are not signed in when they order. What it
 * hands back is a single-use URL for one path in one bucket, and the bucket
 * itself caps size and MIME type, so a forged request cannot do more than
 * upload one image.
 */
export async function POST(request: Request) {
  if (!storageEnabled()) {
    return NextResponse.json({ error: "Uploads are not configured." }, { status: 503 });
  }

  let body: { contentType?: string; size?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof body.size === "number" && body.size > uploadLimits.maxBytes) {
    return NextResponse.json({ error: "That image is too large." }, { status: 413 });
  }

  const result = await createPhotoUpload(String(body.contentType ?? ""));
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ signedUrl: result.signedUrl, publicUrl: result.publicUrl });
}
