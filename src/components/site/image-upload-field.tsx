"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUp, Loader2, X } from "lucide-react";
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, formatBytes } from "@/lib/customisation";
import { Input } from "@/components/ui/input";
import { site } from "@/lib/site";

/**
 * Accepts the customer's reference photograph. Uploading needs Cloudinary; when
 * that is not configured the field falls back to a link, and the checkout
 * prompt covers sending the photo on WhatsApp instead.
 */
export function ImageUploadField({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (url: string) => void;
  hint?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canUpload = cloudinaryEnabled();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That is not an image file.");
      return;
    }
    // Checked before the request so a large file is never uploaded and rejected.
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(
        `${formatBytes(file.size)} is too large. Please keep photos under ${MAX_UPLOAD_LABEL} — a phone photo is usually fine.`,
      );
      return;
    }

    setUploading(true);
    try {
      onChange(await uploadToCloudinary(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-blush">
          <Image src={value} alt="Your reference photo" fill sizes="64px" className="object-cover" />
        </div>
        <p className="flex-1 text-sm text-muted">Photo attached</p>
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-full p-2 text-muted hover:bg-blush hover:text-brand"
          aria-label="Remove photo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {canUpload ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center hover:border-brand">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          ) : (
            <ImageUp className="h-6 w-6 text-brand" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading…" : "Choose a photo"}
          </span>
          <span className="text-xs text-muted">
            JPG or PNG, up to {MAX_UPLOAD_LABEL}. {hint}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste a link to your photo (Drive, Photos, Instagram)"
          />
          <p className="text-xs text-muted">
            Or skip this and send it on{" "}
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              WhatsApp
            </a>{" "}
            after checkout — we will ask you at the last step.
          </p>
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
