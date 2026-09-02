import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Download, MessageCircle, PhoneCall, Upload } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { customisationLabel } from "@/lib/customisation";
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

function needsPhoto(mode: string) {
  return mode === "IMAGE_ONLY" || mode === "TEXT_AND_IMAGE";
}

/** How the customer said they would get their photograph to us. */
function deliveryCopy(delivery: string, consent: boolean) {
  switch (delivery) {
    case "UPLOADED":
      return { icon: Upload, title: "Uploaded at checkout", body: "The photo is attached above." };
    case "WHATSAPP":
      return {
        icon: MessageCircle,
        title: "Sending on WhatsApp",
        body: "Watch for their message before starting work.",
      };
    case "CONTACT_ME":
      return {
        icon: PhoneCall,
        title: "Asked us to contact them",
        body: consent
          ? "They gave permission to call or message for the photo."
          : "No contact permission recorded — email them instead.",
      };
    default:
      return { icon: Upload, title: "No photo needed", body: "This order is text only." };
  }
}

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) notFound();

  const delivery = deliveryCopy(order.imageDelivery, order.contactConsent);
  const DeliveryIcon = delivery.icon;

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
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted">
                    {customisationLabel(item.customisationMode)}
                  </p>

                  {item.customText ? (
                    <p className="mt-2 rounded-lg bg-cream p-3 text-sm">
                      <span className="text-muted">Text to print: </span>
                      <strong className="font-medium">{item.customText}</strong>
                    </p>
                  ) : null}

                  {item.customImageUrl ? (
                    <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-line p-3">
                      <a
                        href={item.customImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-blush"
                        title="Open full size"
                      >
                        <Image
                          src={item.customImageUrl}
                          alt={`Reference photo for ${item.title}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Customer&apos;s photo</p>
                        <p className="mt-0.5 break-all text-xs text-muted">{item.customImageUrl}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={`/api/admin/download?item=${item.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                          <a
                            href={item.customImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-blush"
                          >
                            Open full size
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : needsPhoto(item.customisationMode) ? (
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                      No photo attached yet — see how the customer chose to send it.
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
            <h2 className="font-display text-lg">Photo delivery</h2>
            <div className="mt-3 flex items-start gap-2">
              <DeliveryIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="font-medium">{delivery.title}</p>
                <p className="mt-0.5 text-muted">{delivery.body}</p>
              </div>
            </div>
          </section>

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
