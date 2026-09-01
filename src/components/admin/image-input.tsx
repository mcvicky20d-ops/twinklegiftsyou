"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { cloudinaryEnabled, uploadToCloudinary } from "@/lib/cloudinary";
import { Input } from "@/components/ui/input";

/**
 * Holds the image list for a form. Values are submitted as one newline-separated
 * hidden field so the server action can parse them without extra client state.
 */
export function ImageInput({
  name,
  defaultValue = [],
  max = 6,
}: {
  name: string;
  defaultValue?: string[];
  max?: number;
}) {
  const [images, setImages] = React.useState<string[]>(defaultValue);
  const [url, setUrl] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canUpload = cloudinaryEnabled();

  function addUrl() {
    const value = url.trim();
    if (!value || images.length >= max) return;
    setImages((current) => [...current, value]);
    setUrl("");
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, max - images.length)) {
        uploaded.push(await uploadToCloudinary(file));
      }
      setImages((current) => [...current, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={images.join("\n")} />

      {images.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="relative h-20 w-20">
              <Image
                src={image}
                alt=""
                fill
                sizes="80px"
                className="rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow ring-1 ring-line hover:text-red-600"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Paste an image URL"
          className="flex-1 min-w-56"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
        />
        <button
          type="button"
          onClick={addUrl}
          className="rounded-xl border border-line px-4 text-sm hover:bg-blush"
        >
          Add
        </button>

        {canUpload ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm hover:bg-blush">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {!canUpload ? (
        <p className="mt-2 text-xs text-muted">
          Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to upload
          files directly.
        </p>
      ) : null}
    </div>
  );
}
