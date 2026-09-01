"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/mail";
import { newOrderNumber } from "@/lib/utils";
import { cartItemSchema, checkoutSchema } from "@/lib/validators";
import { shippingFor } from "@/lib/pricing";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; orderId: string; total: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const payloadSchema = z.object({
  customer: checkoutSchema,
  items: z.array(cartItemSchema).min(1, "Your bag is empty"),
});

export async function placeOrder(payload: unknown): Promise<PlaceOrderResult> {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: flat.fieldErrors.customer
        ? {}
        : (flat.fieldErrors as Record<string, string[]>),
    };
  }

  const { customer, items } = parsed.data;

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
      customText: item.customText || null,
      customImageUrl: item.customImageUrl || null,
    };
  });

  if (lines.length !== items.length) {
    return { ok: false, error: "Some items are no longer available. Please refresh your bag." };
  }

  const subtotal = lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

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
      shipping,
      total,
      paymentStatus: customer.paymentMethod === "COD" ? "COD" : "UNPAID",
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
