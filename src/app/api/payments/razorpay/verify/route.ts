import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    signature?: string;
  };

  if (!body.orderId || !body.razorpayOrderId || !body.razorpayPaymentId || !body.signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    razorpayOrderId: body.razorpayOrderId,
    razorpayPaymentId: body.razorpayPaymentId,
    signature: body.signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: body.orderId } });
  // The signature only proves the payment is genuine; this ties it to our order.
  if (!order || order.razorpayOrderId !== body.razorpayOrderId) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      razorpayPaymentId: body.razorpayPaymentId,
    },
  });

  return NextResponse.json({ ok: true });
}
