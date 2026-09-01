import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { site } from "@/lib/site";
import { noIndex } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order confirmation", ...noIndex };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { orderNumber } = await params;
  const { payment } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const pendingPayment = payment === "pending" || order.paymentStatus === "UNPAID";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-line bg-white p-8 text-center">
        {pendingPayment ? (
          <Clock className="mx-auto h-10 w-10 text-amber-500" />
        ) : (
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        )}
        <h1 className="mt-4 font-display text-3xl">Thank you, {order.customerName.split(" ")[0]}!</h1>
        <p className="mt-2 text-sm text-muted">
          Order <strong>{order.orderNumber}</strong> · {formatDate(order.createdAt)}
        </p>
        {pendingPayment ? (
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted">
            Payment is still pending. We will WhatsApp you a payment link along with the design
            preview — nothing is charged until you approve it.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">Payment received. We are starting on it now.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Items</h2>
          <Badge tone={order.paymentStatus === "PAID" ? "green" : "amber"}>
            {order.paymentStatus}
          </Badge>
        </div>
        <ul className="mt-4 divide-y divide-line text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <div>
                <p className="font-medium">
                  {item.title} × {item.quantity}
                </p>
                {item.customText ? (
                  <p className="mt-0.5 text-xs text-muted">“{item.customText}”</p>
                ) : null}
              </div>
              <p>{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl bg-cream p-4 text-sm">
          <p className="font-medium">Delivering to</p>
          <p className="mt-1 text-muted">
            {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""}, {order.city}, {order.state} —{" "}
            {order.pincode}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href={`https://wa.me/${site.whatsapp}?text=Hi! My order is ${order.orderNumber}`}>
          <Button>Send us the reference photo</Button>
        </a>
        <Link href="/products">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
