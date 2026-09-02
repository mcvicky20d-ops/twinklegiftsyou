"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { looksLikeUpiReference } from "@/lib/upi";

export type UpiState = { status: "idle" | "error" | "success"; message?: string };

/**
 * Records the reference the customer read off their UPI app. It marks the
 * payment as *claimed*, never as received — staff confirm against the bank
 * before the order moves on, because anyone could type twelve digits.
 */
export async function submitUpiReference(
  orderNumber: string,
  _previous: UpiState,
  formData: FormData,
): Promise<UpiState> {
  const reference = String(formData.get("upiReference") ?? "").trim();

  if (!looksLikeUpiReference(reference)) {
    return {
      status: "error",
      message: "That does not look like a UPI reference. It is usually 12 digits.",
    };
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return { status: "error", message: "We could not find that order." };
  if (order.paymentStatus === "PAID") {
    return { status: "success", message: "This order is already marked paid." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { upiReference: reference },
  });

  revalidatePath(`/orders/${orderNumber}`);
  return {
    status: "success",
    message: "Thank you — we will confirm the payment and message you shortly.",
  };
}
