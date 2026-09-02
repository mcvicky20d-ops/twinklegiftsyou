"use client";

import * as React from "react";
import Image from "next/image";
import { ImageUp, Loader2, X } from "lucide-react";
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary";
import { uploadCustomerPhoto } from "@/lib/upload-client";
import { MAX_UPLOAD_LABEL, PHOTO_RECOMMENDATION } from "@/lib/customisation";
import { Input } from "@/components/ui/input";
import { site } from "@/lib/site";

/**
 * Uploading needs somewhere to put the file. `uploadsEnabled` is decided on the
 * server (Supabase Storage) and Cloudinary is checked here; with neither, the
 * field falls back to a pasted link and the checkout prompt covers WhatsApp.
 */
export function ImageUploadField({
  value,
  onChange,
  hint,
  uploadsEnabled = false,
}: {
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  uploadsEnabled?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const useCloudinary = cloudinaryEnabled();
  const canUpload = uploadsEnabled || useCloudinary;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(useCloudinary ? await uploadToCloudinary(file) : await uploadCustomerPhoto(file));
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
        <>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-4 py-6 text-center hover:border-brand">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            ) : (
              <ImageUp className="h-6 w-6 text-brand" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Uploading…" : "Upload a photo"}
            </span>
            <span className="text-xs text-muted">JPG, PNG or HEIC, up to {MAX_UPLOAD_LABEL}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>

          <div className="mt-3">
            <p className="text-xs text-muted">Or paste a link instead</p>
            <Input
              className="mt-1"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Google Drive, Photos or Instagram link"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste a link to your photo (Drive, Photos, Instagram)"
          />
          <p className="text-xs text-muted">
            Make sure the link is set so anyone with it can view, or we will not be able to open
            it. Or skip this and send it on{" "}
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

      <p className="mt-2 text-xs text-muted">{PHOTO_RECOMMENDATION}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
