"use client";

import * as React from "react";
import { MessageCircle, PhoneCall, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export type ImageDelivery = "NOT_NEEDED" | "UPLOADED" | "WHATSAPP" | "CONTACT_ME";

/**
 * Asked at checkout for any order needing a photograph. Nothing is assumed:
 * either the photo is already attached, the customer will send it on WhatsApp,
 * or they explicitly permit us to call or message them for it.
 */
export function ImageShareDialog({
  open,
  itemsNeedingImage,
  itemsWithImage,
  orderReference,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  itemsNeedingImage: string[];
  itemsWithImage: number;
  orderReference: string;
  onCancel: () => void;
  onConfirm: (choice: { imageDelivery: ImageDelivery; contactConsent: boolean }) => void;
}) {
  const [choice, setChoice] = React.useState<ImageDelivery>("WHATSAPP");
  const [consent, setConsent] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    // Stop the page behind the dialog from scrolling on a phone.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const whatsappHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    `Hi! I have just placed an order (${orderReference}). Here is the photo for it:`,
  )}`;

  const options: { value: ImageDelivery; icon: typeof Upload; title: string; body: string }[] = [
    {
      value: "WHATSAPP",
      icon: MessageCircle,
      title: "I will send it on WhatsApp",
      body: "Tap through after ordering and send the photo to us directly.",
    },
    {
      value: "CONTACT_ME",
      icon: PhoneCall,
      title: "Please contact me for it",
      body: "We will call or message you to collect the photo.",
    },
  ];

  const needsConsent = choice === "CONTACT_ME";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="share-title" className="font-display text-2xl">
              How will you send your photo?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              We still need a photo for {itemsNeedingImage.join(", ")}.
              {itemsWithImage > 0
                ? " Your other items already have theirs."
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-full p-2 text-muted hover:bg-blush"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setChoice(option.value)}
              aria-pressed={choice === option.value}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                choice === option.value
                  ? "border-brand bg-blush"
                  : "border-line hover:border-brand/50",
              )}
            >
              <option.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium">{option.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {option.body}
                </span>
              </span>
            </button>
          ))}
        </div>

        {needsConsent ? (
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-cream p-4 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-0.5"
            />
            <span className="text-muted">
              Yes, you may call or message me on my mobile number to collect the photo for this
              order.
            </span>
          </label>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            className="flex-1"
            size="lg"
            disabled={needsConsent && !consent}
            onClick={() => onConfirm({ imageDelivery: choice, contactConsent: consent })}
          >
            {choice === "WHATSAPP" ? "Confirm & place order" : "Place order"}
          </Button>
          {choice === "WHATSAPP" ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                Open WhatsApp
              </Button>
            </a>
          ) : null}
        </div>

        <p className="mt-3 text-center text-xs text-muted">
          Nothing is made until you approve a preview of the finished piece.
        </p>
      </div>
    </div>
  );
}
