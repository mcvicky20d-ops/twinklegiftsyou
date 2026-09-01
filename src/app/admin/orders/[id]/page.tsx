import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { updateOrder } from "@/app/actions/admin";
import {
  orderStatuses,
  orderStatusTone,
  paymentStatuses,
  paymentStatusTone,
} from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={orderStatusTone(order.status)}>{order.status.replace("_", " ")}</Badge>
          <Badge tone={paymentStatusTone(order.paymentStatus)}>{order.paymentStatus}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-4 font-display text-lg">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex justify-between gap-4">
                    <p className="font-medium">
                      {item.title} × {item.quantity}
                    </p>
                    <p>{formatPrice(item.unitPrice * item.quantity)}</p>
                  </div>
                  {item.customText ? (
                    <p className="mt-2 rounded-lg bg-cream p-3 text-sm">
                      <span className="text-muted">Personalisation: </span>
                      {item.customText}
                    </p>
                  ) : null}
                  {item.customImageUrl ? (
                    <p className="mt-2 text-sm">
                      <span className="text-muted">Reference: </span>
                      <a
                        href={item.customImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-brand hover:underline"
                      >
                        {item.customImageUrl}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd>{formatPrice(order.shipping)}</dd>
              </div>
              <div className="flex justify-between text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          {order.notes ? (
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-lg">Customer notes</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{order.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <form action={updateOrder} className="space-y-4 rounded-2xl border border-line bg-white p-5">
            <input type="hidden" name="id" value={order.id} />
            <h2 className="font-display text-lg">Update</h2>
            <Field label="Order status">
              <Select name="status" defaultValue={order.status}>
                {orderStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Payment status">
              <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                {paymentStatuses.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>

          <section className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="font-display text-lg">Customer</h2>
            <p className="mt-3 font-medium">{order.customerName}</p>
            <p className="text-muted">
              <a href={`mailto:${order.email}`} className="hover:text-brand">
                {order.email}
              </a>
            </p>
            <p className="text-muted">
              <a href={`tel:${order.phone}`} className="hover:text-brand">
                {order.phone}
              </a>
            </p>
            <p className="mt-4 text-muted">
              {order.addressLine1}
              {order.addressLine2 ? `, ${order.addressLine2}` : ""}
              <br />
              {order.city}, {order.state} — {order.pincode}
            </p>
            <a
              href={`https://wa.me/91${order.phone}?text=Hi ${order.customerName}, about your order ${order.orderNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-brand hover:underline"
            >
              Message on WhatsApp
            </a>
          </section>

          {order.razorpayPaymentId ? (
            <section className="rounded-2xl border border-line bg-white p-5 text-sm">
              <h2 className="font-display text-lg">Payment</h2>
              <p className="mt-2 break-all text-muted">Razorpay order: {order.razorpayOrderId}</p>
              <p className="break-all text-muted">Payment: {order.razorpayPaymentId}</p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
