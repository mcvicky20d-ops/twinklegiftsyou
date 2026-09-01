"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/site/cart-provider";
import { placeOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { shippingFor } from "@/lib/pricing";
import { site } from "@/lib/site";

type Props = { onlinePaymentEnabled: boolean; razorpayKeyId: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutForm({ onlinePaymentEnabled, razorpayKeyId }: Props) {
  const router = useRouter();
  const { items, subtotal, ready, clear } = useCart();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [paymentMethod, setPaymentMethod] = React.useState<"ONLINE" | "COD">(
    onlinePaymentEnabled ? "ONLINE" : "COD",
  );

  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  if (ready && items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
        <p className="font-display text-xl">Nothing to check out</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Browse the shop</Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const customer = {
      customerName: String(form.get("customerName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      addressLine1: String(form.get("addressLine1") ?? ""),
      addressLine2: String(form.get("addressLine2") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      pincode: String(form.get("pincode") ?? ""),
      notes: String(form.get("notes") ?? ""),
      paymentMethod,
    };

    try {
      const result = await placeOrder({
        customer,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          customText: item.customText,
          customImageUrl: item.customImageUrl,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        setPending(false);
        return;
      }

      if (paymentMethod === "ONLINE" && onlinePaymentEnabled) {
        const paid = await payWithRazorpay(result.orderId, result.orderNumber, customer);
        if (!paid) {
          // The order exists and is marked unpaid — the customer can still be
          // followed up, so send them to the confirmation page either way.
          router.push(`/orders/${result.orderNumber}?payment=pending`);
          clear();
          return;
        }
      }

      clear();
      router.push(`/orders/${result.orderNumber}`);
    } catch {
      setError("Something went wrong. Please try again or message us on WhatsApp.");
      setPending(false);
    }
  }

  async function payWithRazorpay(
    orderId: string,
    orderNumber: string,
    customer: { customerName: string; email: string; phone: string },
  ) {
    const loaded = await loadRazorpayScript();
    if (!loaded) return false;

    const response = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { razorpayOrderId: string; amount: number };

    return new Promise<boolean>((resolve) => {
      const checkout = new window.Razorpay!({
        key: razorpayKeyId,
        amount: data.amount,
        currency: "INR",
        name: site.name,
        description: `Order ${orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: customer.customerName,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: "#b4614f" },
        handler: async (payload: Record<string, string>) => {
          const verify = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpayOrderId: payload.razorpay_order_id,
              razorpayPaymentId: payload.razorpay_payment_id,
              signature: payload.razorpay_signature,
            }),
          });
          resolve(verify.ok);
        },
        modal: { ondismiss: () => resolve(false) },
      });
      checkout.open();
    });
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0];

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-xl">Delivery details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" hint={errorFor("customerName")}>
            <Input name="customerName" required autoComplete="name" />
          </Field>
          <Field label="Mobile number" hint={errorFor("phone") ?? "10 digits, for delivery updates"}>
            <Input name="phone" required inputMode="numeric" autoComplete="tel-national" />
          </Field>
        </div>

        <Field label="Email" hint={errorFor("email")}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>

        <Field label="Address" hint={errorFor("addressLine1")}>
          <Input name="addressLine1" required placeholder="House / street" autoComplete="address-line1" />
        </Field>
        <Field label="Landmark / area (optional)">
          <Input name="addressLine2" autoComplete="address-line2" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" hint={errorFor("city")}>
            <Input name="city" required autoComplete="address-level2" />
          </Field>
          <Field label="State" hint={errorFor("state")}>
            <Input name="state" required autoComplete="address-level1" />
          </Field>
          <Field label="PIN code" hint={errorFor("pincode")}>
            <Input name="pincode" required inputMode="numeric" autoComplete="postal-code" />
          </Field>
        </div>

        <Field label="Anything we should know?" hint="Delivery date, spelling, gift note…">
          <Textarea name="notes" />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium">Payment</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {onlinePaymentEnabled ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-checked:border-brand has-checked:bg-blush">
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                <span>
                  <span className="block text-sm font-medium">Pay online</span>
                  <span className="block text-xs text-muted">UPI, cards, netbanking via Razorpay</span>
                </span>
              </label>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-checked:border-brand has-checked:bg-blush">
              <input
                type="radio"
                name="payment"
                className="mt-1"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
              />
              <span>
                <span className="block text-sm font-medium">Pay on confirmation</span>
                <span className="block text-xs text-muted">
                  We message you a UPI link once the design is approved
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-xl">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span className="text-muted">
                {item.title} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={pending || !ready}>
          {pending ? "Placing order…" : `Place order · ${formatPrice(total)}`}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          By ordering you agree to our made-to-order policy.
        </p>
      </aside>
    </form>
  );
}
