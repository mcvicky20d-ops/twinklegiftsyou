"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Check, Copy, Smartphone } from "lucide-react";
import * as React from "react";
import { submitUpiReference, type UpiState } from "@/app/actions/payments";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export function UpiPaymentPanel({
  orderNumber,
  amount,
  upiId,
  paymentLink,
  qrDataUrl,
  existingReference,
}: {
  orderNumber: string;
  amount: number;
  upiId: string;
  paymentLink: string;
  qrDataUrl: string;
  existingReference: string | null;
}) {
  const action = submitUpiReference.bind(null, orderNumber);
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as UpiState);
  const [copied, setCopied] = React.useState(false);

  if (existingReference || state.status === "success") {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-3 font-display text-xl">Payment details received</p>
        <p className="mt-1 text-sm text-emerald-900">
          {state.message ??
            "We are confirming your payment and will message you as soon as it clears."}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-xl">Pay {formatPrice(amount)} by UPI</h2>
      <p className="mt-1 text-sm text-muted">
        Scan the code, or tap the button on your phone to open your UPI app.
      </p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <Image
          src={qrDataUrl}
          alt={`UPI QR code to pay ${formatPrice(amount)} to ${upiId}`}
          width={180}
          height={180}
          unoptimized
          className="rounded-xl border border-line"
        />

        <div className="flex-1 space-y-3 text-sm">
          <div>
            <p className="text-muted">UPI ID</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded-lg bg-cream px-3 py-1.5 text-sm">{upiId}</code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(upiId);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs hover:bg-blush"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <p className="text-muted">
            Add <strong className="text-ink">{orderNumber}</strong> as the payment note so we can
            match it to your order.
          </p>

          {/* The upi:// scheme only resolves on a device with a UPI app. */}
          <a href={paymentLink} className="inline-block sm:hidden">
            <Button size="lg">
              <Smartphone className="h-4 w-4" /> Open UPI app
            </Button>
          </a>
        </div>
      </div>

      <form action={formAction} className="mt-6 border-t border-line pt-5">
        <Field
          label="Paid? Enter the UPI reference number"
          hint={state.status === "error" ? state.message : "Your UPI app shows it after payment — usually 12 digits."}
        >
          <Input name="upiReference" placeholder="e.g. 402183746512" inputMode="numeric" required />
        </Field>
        <Button type="submit" className="mt-3" disabled={pending}>
          {pending ? "Submitting…" : "I have paid"}
        </Button>
      </form>
    </section>
  );
}
