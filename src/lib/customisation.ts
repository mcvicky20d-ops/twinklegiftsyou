import type { CustomisationMode } from "@/generated/prisma/enums";

/** Uploads larger than this are rejected in the browser before any request. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "5 MB";

export const customisationOptions = [
  {
    value: "TEXT_ONLY" as const,
    label: "Text only",
    hint: "A name, date or short message — no photo needed.",
  },
  {
    value: "IMAGE_ONLY" as const,
    label: "Photo only",
    hint: "We work straight from your photograph.",
  },
  {
    value: "TEXT_AND_IMAGE" as const,
    label: "Photo + text",
    hint: "Your photo with a name, date or message alongside it.",
  },
];

export function needsText(mode: CustomisationMode) {
  return mode === "TEXT_ONLY" || mode === "TEXT_AND_IMAGE";
}

export function needsImage(mode: CustomisationMode) {
  return mode === "IMAGE_ONLY" || mode === "TEXT_AND_IMAGE";
}

export function customisationLabel(mode: CustomisationMode) {
  switch (mode) {
    case "TEXT_ONLY":
      return "Text only";
    case "IMAGE_ONLY":
      return "Photo only";
    case "TEXT_AND_IMAGE":
      return "Photo + text";
    default:
      return "No personalisation";
  }
}

/** Shown wherever a photo is requested, upload field or pasted link alike. */
export const PHOTO_RECOMMENDATION =
  `Recommended: a clear, well-lit photo, sharp and as large as you have it — under ${MAX_UPLOAD_LABEL}. A phone photo is usually perfect. Avoid screenshots, heavy filters and blurry group shots.`;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
