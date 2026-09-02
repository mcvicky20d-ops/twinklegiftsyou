import Image from "next/image";
import { HardDrive, ImageOff } from "lucide-react";
import { listPhotos, storageEnabled, STORAGE_QUOTA_BYTES } from "@/lib/storage";
import { deleteStoredPhoto } from "@/app/actions/admin";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";
import { formatBytes } from "@/lib/customisation";

export const dynamic = "force-dynamic";

export default async function AdminLibraryPage() {
  if (!storageEnabled()) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl">Photo library</h1>
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <ImageOff className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-display text-xl">Uploads are not configured</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your hosting environment to let
            customers upload photos directly. Until then they paste a link or send it on WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  const photos = await listPhotos();
  const used = photos.reduce((total, photo) => total + photo.size, 0);
  const percent = Math.min(100, (used / STORAGE_QUOTA_BYTES) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Photo library</h1>
        <p className="mt-1 text-sm text-muted">
          Every photo customers have uploaded. Delete the ones you no longer need — nothing is
          removed automatically.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-brand" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">
                {formatBytes(used)} of {formatBytes(STORAGE_QUOTA_BYTES)} used
              </p>
              <p className="text-xs text-muted">
                {photos.length} photo{photos.length === 1 ? "" : "s"} · {percent.toFixed(1)}%
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
              <div
                // Colour shifts as the free tier fills, so it is obvious well
                // before uploads start failing.
                className={
                  percent > 90 ? "h-full bg-red-500" : percent > 70 ? "h-full bg-amber-500" : "h-full bg-brand"
                }
                style={{ width: `${Math.max(percent, 0.5)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
          No photos uploaded yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.path} className="overflow-hidden rounded-2xl border border-line bg-white">
              <a
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="relative block aspect-square bg-blush"
                title="Open full size"
              >
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 240px"
                  className="object-cover"
                />
              </a>
              <div className="p-3">
                <p className="truncate text-xs text-muted" title={photo.path}>
                  {photo.path}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatBytes(photo.size)}
                  {photo.createdAt ? ` · ${formatDate(photo.createdAt)}` : ""}
                </p>
                <form action={deleteStoredPhoto} className="mt-2 flex justify-end">
                  <DeleteButton
                    action={deleteStoredPhoto}
                    id={photo.path}
                    idField="path"
                    confirmText={`Delete this photo permanently? If an order still needs it, download it first.`}
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
