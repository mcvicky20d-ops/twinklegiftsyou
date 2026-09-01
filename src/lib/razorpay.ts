import crypto from "node:crypto";
import Razorpay from "razorpay";

export function razorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayClient() {
  if (!razorpayEnabled()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/** Verifies the signature Razorpay Checkout hands back to the browser. */
export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
