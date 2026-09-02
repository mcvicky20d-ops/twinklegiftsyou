import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Streams a customer's reference photo through the app so staff get a real
 * download rather than a new tab. Cloudinary and other hosts serve images
 * inline with no filename, and a cross-origin <a download> is ignored by the
 * browser — proxying is what makes the download attribute work.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const itemId = new URL(request.url).searchParams.get("item");
  if (!itemId) return NextResponse.json({ error: "item is required" }, { status: 400 });

  // The URL comes from the database rather than the query string, so this
  // cannot be pointed at an arbitrary host by editing the link.
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: { select: { orderNumber: true } } },
  });
  if (!item?.customImageUrl) {
    return NextResponse.json({ error: "No image on this item" }, { status: 404 });
  }

  let source: URL;
  try {
    source = new URL(item.customImageUrl);
  } catch {
    return NextResponse.json({ error: "Stored image is not a URL" }, { status: 422 });
  }
  if (source.protocol !== "https:") {
    return NextResponse.json({ error: "Only https images can be fetched" }, { status: 422 });
  }

  const upstream = await fetch(source, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not fetch the image" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const extension = contentType.split("/")[1]?.split(";")[0]?.replace("jpeg", "jpg") ?? "jpg";
  const safeTitle = item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = `${item.order.orderNumber}-${safeTitle}.${extension}`;

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
