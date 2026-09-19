import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Package, Gift } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/site/profile-form";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "My account", ...noIndex };

export default async function AccountPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, orders, addressCount] = await Promise.all([
    safeQuery(() => prisma.user.findUnique({ where: { id: userId } }), null),
    safeQuery(
      () =>
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { items: true },
        }),
      [],
    ),
    safeQuery(() => prisma.address.count({ where: { userId } }), 0),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <section className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-xl">Your details</h2>
        <ProfileForm name={user?.name ?? session!.user.name ?? ""} phone={user?.phone ?? ""} />
        <p className="mt-4 text-xs text-muted">
          Email {session!.user.email} cannot be changed here — message us if it needs updating.
        </p>
      </section>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/account/orders"
            className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand"
          >
            <Package className="h-5 w-5 text-brand" />
            <p className="mt-3 font-display text-2xl">{orders.length > 0 ? "Orders" : "No orders yet"}</p>
            <p className="text-sm text-muted">Track what you have ordered</p>
          </Link>
          <Link
            href="/account/addresses"
            className="rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand"
          >
            <MapPin className="h-5 w-5 text-brand" />
            <p className="mt-3 font-display text-2xl">
              {addressCount} address{addressCount === 1 ? "" : "es"}
            </p>
            <p className="text-sm text-muted">Reuse them at checkout in one tap</p>
          </Link>
        </div>

        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Recent orders</h2>
            <Link href="/account/orders" className="text-sm text-brand hover:underline">
              See all
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Nothing here yet.{" "}
              <Link href="/products" className="text-brand hover:underline">
                Browse the shop
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link
                      href={`/orders/${order.orderNumber}`}
                      className="text-sm font-medium hover:text-brand"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">
                      {formatDate(order.createdAt)} · {order.items.length} item
                      {order.items.length > 1 ? "s" : ""}
                      {order.isGift ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-brand">
                          <Gift className="h-3 w-3" /> gift for {order.recipientName}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{order.status}</Badge>
                    <span className="text-sm">{formatPrice(order.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
