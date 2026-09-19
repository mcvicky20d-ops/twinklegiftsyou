import Link from "next/link";
import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "My orders", ...noIndex };

const statusTone: Record<string, string> = {
  PENDING: "amber",
  CONFIRMED: "blue",
  IN_PROGRESS: "blue",
  SHIPPED: "brand",
  DELIVERED: "green",
  CANCELLED: "red",
};

export default async function AccountOrdersPage() {
  const session = await auth();
  const orders = await safeQuery(
    () =>
      prisma.order.findMany({
        where: { userId: session!.user.id },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
    [],
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
        <p className="font-display text-xl">No orders yet</p>
        <p className="mt-2 text-sm text-muted">
          Orders placed while signed in show up here with their status.
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Browse the shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{order.orderNumber}</p>
              <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={statusTone[order.status] ?? "neutral"}>{order.status}</Badge>
              <Badge tone={order.paymentStatus === "PAID" ? "green" : "amber"}>
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <ul className="mt-3 space-y-1 text-sm text-muted">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.title} × {item.quantity}
              </li>
            ))}
          </ul>

          {order.isGift ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-blush px-3 py-2 text-xs text-brand-dark">
              <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Gift for {order.recipientName}
                {order.recipientPhone ? ` · ${order.recipientPhone}` : ""}
                {order.addressReference ? ` · address ${order.addressReference}` : ""}
                {order.giftMessage ? (
                  <span className="mt-1 block italic">“{order.giftMessage}”</span>
                ) : null}
              </span>
            </p>
          ) : order.addressReference ? (
            <p className="mt-3 text-xs text-muted">Delivery address {order.addressReference}</p>
          ) : null}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm font-medium">{formatPrice(order.total)}</span>
            <Link href={`/orders/${order.orderNumber}`} className="text-sm text-brand hover:underline">
              View order
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
