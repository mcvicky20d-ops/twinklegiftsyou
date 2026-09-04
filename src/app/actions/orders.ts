"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/mail";
import { newOrderNumber } from "@/lib/utils";
import { cartItemSchema, checkoutSchema, imageDeliverySchema } from "@/lib/validators";
import { DEFAULT_SHIPPING_FEE, quoteShipping } from "@/lib/pricing";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; orderId: string; total: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const payloadSchema = z.object({
  customer: checkoutSchema,
  items: z.array(cartItemSchema).min(1, "Your bag is empty"),
  sharing: imageDeliverySchema,
});

export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    // Customer fields sit under `customer` in the payload, so a flatten at the
    // top level buries every message one level down and the form has nothing
    // to highlight. Walk the issues instead and key them by the field name the
    // checkout form actually renders.
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const [head, next] = issue.path;
      const field = head === "customer" ? next : head;
      if (typeof field !== "string") continue;
      (fieldErrors[field] ??= []).push(issue.message);
    }

    const itemsProblem = parsed.error.issues.find((issue) => issue.path[0] === "items");

    return {
      ok: false,
      error: itemsProblem
        ? itemsProblem.message
        : "Please correct the fields marked in red below.",
      fieldErrors,
    };
  }

  const { customer, items, sharing } = parsed.data;

  // Never trust prices from the browser — re-read them from the database.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) }, isActive: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines = items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new Error("One of the items is no longer available.");
    return {
      productId: product.id,
      title: product.title,
      unitPrice: product.price,
      quantity: item.quantity,
      customisationMode: item.customisationMode ?? "NONE",
      customText: item.customText || null,
      customImageUrl: item.customImageUrl || null,
    };
  });

  if (lines.length !== items.length) {
    return { ok: false, error: "Some items are no longer available. Please refresh your bag." };
  }

  const subtotal = lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);

  const zones = await prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  const quote = quoteShipping(
    items.map((item) => ({
      shippingFee: byId.get(item.productId)?.shippingFee ?? DEFAULT_SHIPPING_FEE,
      quantity: item.quantity,
    })),
    zones,
    customer.state,
  );
  const total = subtotal + quote.total;

  const order = await prisma.order.create({
    data: {
      orderNumber: newOrderNumber(),
      customerName: customer.customerName,
      email: customer.email.toLowerCase(),
      phone: customer.phone,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2 || null,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      notes: customer.notes || null,
      subtotal,
      shipping: quote.total,
      shippingZone: quote.zoneName,
      total,
      paymentMethod: customer.paymentMethod,
      paymentStatus: "UNPAID",
      imageDelivery: sharing.imageDelivery,
      contactConsent: sharing.contactConsent,
      items: { create: lines },
    },
    include: { items: true },
  });

  await sendOrderConfirmation({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    total: order.total,
    items: order.items,
  });

  return { ok: true, orderNumber: order.orderNumber, orderId: order.id, total: order.total };
}
