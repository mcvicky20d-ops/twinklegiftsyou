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
import { ImageShareDialog, type ImageDelivery } from "@/components/site/image-share-dialog";
import { needsImage } from "@/lib/customisation";

type Props = {
  onlinePaymentEnabled: boolean;
  razorpayKeyId: string;
  upiPaymentEnabled: boolean;
  upiId: string;
};

type PaymentMethod = "RAZORPAY" | "UPI" | "PENDING";

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

export function CheckoutForm({
  onlinePaymentEnabled,
  razorpayKeyId,
  upiPaymentEnabled,
  upiId,
}: Props) {
  const router = useRouter();
  const { items, subtotal, ready, clear } = useCart();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  // PENDING only appears when neither payment route is configured, so the shop
  // can still take orders rather than showing no way to pay at all.
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    onlinePaymentEnabled ? "RAZORPAY" : upiPaymentEnabled ? "UPI" : "PENDING",
  );
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  // Held while the dialog is open so submission can resume once answered.
  const pendingCustomer = React.useRef<Record<string, unknown> | null>(null);

  // Which lines still owe us a photograph, and which already carry one.
  const awaitingImage = items
    .filter((item) => needsImage(item.customisationMode ?? "NONE") && !item.customImageUrl)
    .map((item) => item.title);
  const withImage = items.filter((item) => item.customImageUrl).length;
  // Only interrupt when a photo is actually missing. Someone who has already
  // attached one has answered the question; asking again is friction.
  const needsPhotoStep = awaitingImage.length > 0;

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      acceptedTerms: true as const,
    };

    pendingCustomer.current = customer;

    if (needsPhotoStep) {
      setShareOpen(true);
      return;
    }
    void placeWith(customer, {
      imageDelivery: withImage > 0 ? "UPLOADED" : "NOT_NEEDED",
      contactConsent: false,
    });
  }

  async function placeWith(
    customer: Record<string, unknown>,
    sharing: { imageDelivery: ImageDelivery; contactConsent: boolean },
  ) {
    setShareOpen(false);
    setPending(true);

    try {
      const result = await placeOrder({
        customer,
        sharing,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          customisationMode: item.customisationMode ?? "NONE",
          customText: item.customText,
          customImageUrl: item.customImageUrl,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        const errors = result.fieldErrors ?? {};
        setFieldErrors(errors);
        setPending(false);
        // The summary sits in the sidebar, which on a phone is far below the
        // fields it refers to. Move the visitor to the first problem instead.
        const firstField = Object.keys(errors)[0];
        if (firstField) {
          requestAnimationFrame(() => {
            const input = document.querySelector<HTMLElement>(`[name="${firstField}"]`);
            input?.scrollIntoView({ behavior: "smooth", block: "center" });
            input?.focus({ preventScroll: true });
          });
        }
        return;
      }

      if (paymentMethod === "RAZORPAY" && onlinePaymentEnabled) {
        const paid = await payWithRazorpay(
          result.orderId,
          result.orderNumber,
          customer as unknown as { customerName: string; email: string; phone: string },
        );
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
          <Field label="Full name" error={errorFor("customerName")}>
            <Input name="customerName" required minLength={2} maxLength={80} autoComplete="name" />
          </Field>
          <Field
            label="Mobile number"
            error={errorFor("phone")}
            hint="10 digits, for delivery updates"
          >
            <Input
              name="phone"
              required
              inputMode="numeric"
              // Caught by the browser before a round trip to the server.
              pattern="[6-9][0-9]{9}"
              title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
              autoComplete="tel-national"
            />
          </Field>
        </div>

        <Field label="Email" error={errorFor("email")}>
          <Input name="email" type="email" required autoComplete="email" />
        </Field>

        <Field label="Address" error={errorFor("addressLine1")}>
          <Input
            name="addressLine1"
            required
            minLength={5}
            placeholder="House / street"
            autoComplete="address-line1"
          />
        </Field>
        <Field label="Landmark / area (optional)">
          <Input name="addressLine2" autoComplete="address-line2" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" error={errorFor("city")}>
            <Input name="city" required minLength={2} autoComplete="address-level2" />
          </Field>
          <Field label="State" error={errorFor("state")}>
            <Input name="state" required minLength={2} autoComplete="address-level1" />
          </Field>
          <Field label="PIN code" error={errorFor("pincode")}>
            <Input
              name="pincode"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              title="A 6-digit PIN code"
              autoComplete="postal-code"
            />
          </Field>
        </div>

        <Field label="Anything we should know?" hint="Delivery date, spelling, gift note…">
          <Textarea name="notes" />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium">Payment</p>
          <div className="grid gap-3">
            {onlinePaymentEnabled ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-checked:border-brand has-checked:bg-blush">
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === "RAZORPAY"}
                  onChange={() => setPaymentMethod("RAZORPAY")}
                />
                <span>
                  <span className="block text-sm font-medium">Pay online</span>
                  <span className="block text-xs text-muted">
                    UPI, cards, netbanking and wallets via Razorpay
                  </span>
                </span>
              </label>
            ) : null}

            {upiPaymentEnabled ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-checked:border-brand has-checked:bg-blush">
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === "UPI"}
                  onChange={() => setPaymentMethod("UPI")}
                />
                <span>
                  <span className="block text-sm font-medium">Pay by UPI</span>
                  <span className="block text-xs text-muted">
                    Scan a QR or tap to pay {upiId} from GPay, PhonePe or any UPI app. We show the
                    QR on the next screen.
                  </span>
                </span>
              </label>
            ) : null}

            {!onlinePaymentEnabled && !upiPaymentEnabled ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-checked:border-brand has-checked:bg-blush">
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked
                  readOnly
                />
                <span>
                  <span className="block text-sm font-medium">Payment link on WhatsApp</span>
                  <span className="block text-xs text-muted">
                    We will send you a payment link once we confirm your order.
                  </span>
                </span>
              </label>
            ) : null}
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

        <label className="mt-5 flex items-start gap-3 text-xs text-muted">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5"
            required
          />
          <span>
            I have read the{" "}
            <Link href="/terms" target="_blank" className="text-brand hover:underline">
              terms and conditions
            </Link>
            , including that personalised gifts cannot be returned unless an unboxing video shows
            the damage.
          </span>
        </label>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={pending || !ready || !acceptedTerms}
        >
          {pending ? "Placing order…" : `Place order · ${formatPrice(total)}`}
        </Button>
      </aside>

      <ImageShareDialog
        open={shareOpen}
        itemsNeedingImage={awaitingImage}
        itemsWithImage={withImage}
        orderReference={`${items.length} item${items.length > 1 ? "s" : ""}`}
        onCancel={() => setShareOpen(false)}
        onConfirm={(choice) => {
          if (pendingCustomer.current) void placeWith(pendingCustomer.current, choice);
        }}
      />
    </form>
  );
}
