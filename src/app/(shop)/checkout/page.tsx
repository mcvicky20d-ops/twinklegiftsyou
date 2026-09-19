import type { Metadata } from "next";
import { CheckoutForm } from "@/components/site/checkout-form";
import { razorpayEnabled } from "@/lib/razorpay";
import { upiConfig, upiEnabled } from "@/lib/upi";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

  const session = await auth();
  const userId = session?.user?.id;

  const [profile, addresses] = await Promise.all([
    userId ? safeQuery(() => prisma.user.findUnique({ where: { id: userId } }), null) : null,
    userId
      ? safeQuery(
          () =>
            prisma.address.findMany({
              where: { userId },
              orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            }),
          [],
        )
      : [],
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        We will confirm your order on WhatsApp and share a preview before dispatch.
      </p>
      {session?.user ? null : (
        <p className="mt-4 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted">
          <Link href="/login?callbackUrl=/checkout" className="text-brand hover:underline">
            Sign in
          </Link>{" "}
          to fill this in from a saved address, or carry on as a guest.
        </p>
      )}
      <CheckoutForm
        onlinePaymentEnabled={razorpayEnabled()}
        razorpayKeyId={process.env.RAZORPAY_KEY_ID ?? ""}
        upiPaymentEnabled={upiEnabled()}
        upiId={upiConfig.vpa}
        zones={zones}
        signedIn={Boolean(session?.user)}
        account={
          session?.user
            ? {
                name: profile?.name ?? session.user.name ?? "",
                email: profile?.email ?? session.user.email ?? "",
                phone: profile?.phone ?? "",
              }
            : null
        }
        addresses={addresses.map((address) => ({
          id: address.id,
          reference: address.reference,
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "",
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          isDefault: address.isDefault,
        }))}
      />
    </div>
  );
}
