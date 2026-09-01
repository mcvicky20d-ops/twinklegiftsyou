import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpayClient } from "@/lib/razorpay";

export async function POST(request: Request) {
  const client = razorpayClient();
  if (!client) {
    return NextResponse.json({ error: "Online payments are not configured." }, { status: 503 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  const rzpOrder = await client.orders.create({
    amount: order.total, // already in paise
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderNumber: order.orderNumber },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzpOrder.id },
  });

  return NextResponse.json({ razorpayOrderId: rzpOrder.id, amount: order.total });
}
