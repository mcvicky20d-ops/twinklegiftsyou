import type { Metadata } from "next";
import { CheckoutForm } from "@/components/site/checkout-form";
import { razorpayEnabled } from "@/lib/razorpay";
import { upiConfig, upiEnabled } from "@/lib/upi";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "Checkout", ...noIndex };

// Which payment routes exist is read from the environment at request time, so
// this page must not be frozen into the build output.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const zones = await safeQuery(
    () => prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } }),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        We will confirm your order on WhatsApp and share a preview before dispatch.
      </p>
      <CheckoutForm
        onlinePaymentEnabled={razorpayEnabled()}
        razorpayKeyId={process.env.RAZORPAY_KEY_ID ?? ""}
        upiPaymentEnabled={upiEnabled()}
        upiId={upiConfig.vpa}
        zones={zones}
      />
    </div>
  );
}
