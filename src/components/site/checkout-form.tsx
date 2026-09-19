"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/site/cart-provider";
import { placeOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { DEFAULT_SHIPPING_FEE, quoteShipping, type ShippingZoneRule } from "@/lib/pricing";
import { site } from "@/lib/site";
import { ImageShareDialog, type ImageDelivery } from "@/components/site/image-share-dialog";
import { needsImage } from "@/lib/customisation";
import { Gift } from "lucide-react";

export type CheckoutAddress = {
  id: string;
  reference: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type Props = {
  onlinePaymentEnabled: boolean;
  razorpayKeyId: string;
  upiPaymentEnabled: boolean;
  upiId: string;
  zones: ShippingZoneRule[];
  signedIn: boolean;
  account: { name: string; email: string; phone: string } | null;
  addresses: CheckoutAddress[];
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
  zones,
  signedIn,
  account,
  addresses,
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

  const defaultAddress = addresses.find((entry) => entry.isDefault) ?? addresses[0] ?? null;

  // Every field is controlled: a saved address fills them in one click, and
  // React 19 would otherwise reset uncontrolled inputs after a failed action.
  const [values, setValues] = React.useState({
    customerName: account?.name ?? "",
    email: account?.email ?? "",
    phone: account?.phone ?? "",
    addressLine1: defaultAddress?.addressLine1 ?? "",
    addressLine2: defaultAddress?.addressLine2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    pincode: defaultAddress?.pincode ?? "",
    notes: "",
  });
  const set =
    (key: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((previous) => ({ ...previous, [key]: event.target.value }));

  const [addressId, setAddressId] = React.useState<string>(defaultAddress?.id ?? "");
  const [saveNewAddress, setSaveNewAddress] = React.useState(signedIn);
  const [saveAddressLabel, setSaveAddressLabel] = React.useState("");

  // A gift goes to someone else: the address above becomes theirs, and we add
  // their name, number and the message that goes on the card.
  const [isGift, setIsGift] = React.useState(false);
  const [gift, setGift] = React.useState({ recipientName: "", recipientPhone: "", giftMessage: "" });

  function applySavedAddress(entry: CheckoutAddress) {
    setAddressId(entry.id);
    setValues((previous) => ({
      ...previous,
      addressLine1: entry.addressLine1,
      addressLine2: entry.addressLine2,
      city: entry.city,
      state: entry.state,
      pincode: entry.pincode,
      // A saved address carries whoever receives it, which for a gift is the
      // recipient rather than the person paying.
      ...(isGift ? {} : { customerName: previous.customerName || entry.fullName }),
    }));
    if (isGift) {
      setGift((previous) => ({
        ...previous,
        recipientName: previous.recipientName || entry.fullName,
        recipientPhone: previous.recipientPhone || entry.phone,
      }));
    }
    setSaveNewAddress(false);
  }

  // Editing any address line means this is no longer the saved address.
  function editAddress(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setAddressId("");
      set(key)(event);
    };
  }

  // The delivery quote follows the state field, so the total is never a
  // surprise at the last step. The server recalculates it anyway.
  const quote = quoteShipping(
    items.map((item) => ({
      shippingFee: item.shippingFee ?? DEFAULT_SHIPPING_FEE,
      quantity: item.quantity,
    })),
    zones,
    values.state,
  );
  const shipping = quote.total;
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

    const customer = {
      ...values,
      paymentMethod,
      acceptedTerms: true as const,
      isGift,
      recipientName: isGift ? gift.recipientName : "",
      recipientPhone: isGift ? gift.recipientPhone : "",
      giftMessage: isGift ? gift.giftMessage : "",
      addressId,
      // Only offer to keep an address that did not come from the book already.
      saveAddress: signedIn && !addressId && saveNewAddress,
      saveAddressLabel,
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
        <h2 className="font-display text-xl">Your details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" error={errorFor("customerName")}>
            <Input
              name="customerName"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              value={values.customerName}
              onChange={set("customerName")}
            />
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
              value={values.phone}
              onChange={set("phone")}
            />
          </Field>
        </div>

        <Field label="Email" error={errorFor("email")}>
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
          />
        </Field>

        <div className="rounded-xl border border-line p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={isGift}
              onChange={(event) => setIsGift(event.target.checked)}
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4 text-brand" />
                This is a gift for someone else
              </span>
              <span className="block text-xs text-muted">
                We deliver to their address, leave the price off the parcel and write your message
                on a card.
              </span>
            </span>
          </label>

          {isGift ? (
            <div className="mt-4 space-y-4 border-t border-line pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Who is it for?" error={errorFor("recipientName")}>
                  <Input
                    name="recipientName"
                    required
                    minLength={2}
                    maxLength={80}
                    value={gift.recipientName}
                    onChange={(event) =>
                      setGift((previous) => ({ ...previous, recipientName: event.target.value }))
                    }
                  />
                </Field>
                <Field
                  label="Their mobile number"
                  error={errorFor("recipientPhone")}
                  hint="So the courier can reach them"
                >
                  <Input
                    name="recipientPhone"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
                    value={gift.recipientPhone}
                    onChange={(event) =>
                      setGift((previous) => ({ ...previous, recipientPhone: event.target.value }))
                    }
                  />
                </Field>
              </div>
              <Field
                label="Message on the gift card"
                error={errorFor("giftMessage")}
                hint="Up to 400 characters — we write it out by hand"
              >
                <Textarea
                  name="giftMessage"
                  maxLength={400}
                  placeholder="Happy birthday, Amma! With all my love — Vicky"
                  value={gift.giftMessage}
                  onChange={(event) =>
                    setGift((previous) => ({ ...previous, giftMessage: event.target.value }))
                  }
                />
              </Field>
            </div>
          ) : null}
        </div>

        <h2 className="pt-2 font-display text-xl">
          {isGift ? "Where should the gift go?" : "Delivery address"}
        </h2>

        {addresses.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => applySavedAddress(entry)}
                className={cn(
                  "rounded-xl border p-3 text-left text-xs transition-colors",
                  addressId === entry.id
                    ? "border-brand bg-blush"
                    : "border-line hover:border-brand",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{entry.label}</span>
                  <span className="font-mono text-[11px] text-muted">{entry.reference}</span>
                </span>
                <span className="mt-1 block text-muted">
                  {entry.fullName} · {entry.addressLine1}, {entry.city}, {entry.state}{" "}
                  {entry.pincode}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <Field label="Address" error={errorFor("addressLine1")}>
          <Input
            name="addressLine1"
            required
            minLength={5}
            placeholder="House / street"
            autoComplete="address-line1"
            value={values.addressLine1}
            onChange={editAddress("addressLine1")}
          />
        </Field>
        <Field label="Landmark / area (optional)">
          <Input
            name="addressLine2"
            autoComplete="address-line2"
            value={values.addressLine2}
            onChange={editAddress("addressLine2")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="City" error={errorFor("city")}>
            <Input
              name="city"
              required
              minLength={2}
              autoComplete="address-level2"
              value={values.city}
              onChange={editAddress("city")}
            />
          </Field>
          <Field
            label="State"
            error={errorFor("state")}
            hint={quote.resolved ? undefined : "Sets your delivery charge"}
          >
            <Input
              name="state"
              required
              minLength={2}
              autoComplete="address-level1"
              list="delivery-states"
              value={values.state}
              onChange={editAddress("state")}
            />
            <datalist id="delivery-states">
              {zones.flatMap((zone) => zone.states).map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>
          <Field label="PIN code" error={errorFor("pincode")}>
            <Input
              name="pincode"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              title="A 6-digit PIN code"
              autoComplete="postal-code"
              value={values.pincode}
              onChange={editAddress("pincode")}
            />
          </Field>
        </div>

        {signedIn && !addressId ? (
          <div className="rounded-xl bg-blush/50 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={saveNewAddress}
                onChange={(event) => setSaveNewAddress(event.target.checked)}
              />
              <span>
                Save this address to my account
                <span className="block text-xs text-muted">
                  It gets a short ID you can quote to us, which is handy when you send gifts to
                  different people.
                </span>
              </span>
            </label>
            {saveNewAddress ? (
              <div className="mt-3">
                <Field label="Name this address" hint="Home, Office, Amma's place…">
                  <Input
                    name="saveAddressLabel"
                    maxLength={40}
                    placeholder={isGift ? "Gift recipient" : "Home"}
                    value={saveAddressLabel}
                    onChange={(event) => setSaveAddressLabel(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        ) : null}

        {!signedIn ? (
          <p className="text-xs text-muted">
            <Link href="/login?callbackUrl=/checkout" className="text-brand hover:underline">
              Sign in
            </Link>{" "}
            to save this address for next time.
          </p>
        ) : null}

        <Field label="Anything we should know?" hint="Delivery date, spelling, gift note…">
          <Textarea name="notes" value={values.notes} onChange={set("notes")} />
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
            <dt className="text-muted">
              Delivery
              {quote.zoneName && quote.resolved ? (
                <span className="block text-xs">{quote.zoneName}</span>
              ) : null}
            </dt>
            <dd className="text-right">
              {formatPrice(shipping)}
              {quote.resolved ? null : (
                <span className="block text-xs text-muted">enter state</span>
              )}
            </dd>
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
