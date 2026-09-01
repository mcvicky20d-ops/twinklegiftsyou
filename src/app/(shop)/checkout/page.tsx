import type { Metadata } from "next";
import { CheckoutForm } from "@/components/site/checkout-form";
import { razorpayEnabled } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        We will confirm your order on WhatsApp and share a preview before dispatch.
      </p>
      <CheckoutForm
        onlinePaymentEnabled={razorpayEnabled()}
        razorpayKeyId={process.env.RAZORPAY_KEY_ID ?? ""}
      />
    </div>
  );
}
