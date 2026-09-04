import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Video } from "lucide-react";
import { canonical } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Order terms for TwinkleGiftsYou: made-to-order timelines, delivery across India, payment, and the returns policy for personalised gifts.",
  ...canonical("/terms"),
};

const updated = "2 September 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>

      {/* The returns rule is the one people are most likely to be caught out
          by, so it leads rather than sitting buried in a numbered list. */}
      <section className="mt-10 rounded-2xl border border-brand/30 bg-blush p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <h2 className="font-display text-xl">Returns on personalised gifts</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              Personalised and made-to-order items — pencil portraits, printed mugs, engraved and
              photo frames — <strong>cannot be returned or exchanged</strong>. They are made for
              one person and cannot be resold.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              The one exception is damage. If your parcel arrives broken or the item is faulty, we
              will replace it — but we need proof.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl bg-white p-4">
          <Video className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Record an unboxing video</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Film one continuous video from the moment you start opening the sealed parcel until
              the item is fully unwrapped. Without that video we cannot verify whether damage
              happened in transit, and the item will not be eligible for a replacement or refund.
              Send the video to us on WhatsApp within 48 hours of delivery.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 space-y-9 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-xl text-ink">1. Made to order</h2>
          <p className="mt-2">
            Every item is made after you order it. Pencil portraits take 5–7 working days to draw;
            printed items such as mugs and frames are usually dispatched in 3–4 working days.
            Delivery adds roughly 2–7 days depending on your pin code.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">2. Your photograph and text</h2>
          <p className="mt-2">
            You are responsible for the photograph and wording you send us. By submitting them you
            confirm you have the right to use that image, and you permit us to reproduce it on the
            item you have ordered. We use your photo only to make your gift — never for
            advertising — unless you separately tell us we may.
          </p>
          <p className="mt-2">
            Please check spelling, names and dates carefully. We print exactly what you give us,
            and a typo in submitted text is not grounds for a replacement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">3. Preview and approval</h2>
          <p className="mt-2">
            We photograph the finished piece and send it to you before dispatch. Nothing ships
            until you approve it. If something is not right at that stage, tell us and we will fix
            it at no cost.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">4. Handmade variation</h2>
          <p className="mt-2">
            Pencil work is drawn by hand, so no two pieces are identical and the finished drawing
            is an artistic interpretation of your photograph rather than a mechanical copy. Slight
            variation in shading, colour and print position is normal and is not a defect.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">5. Pricing, payment and cancellation</h2>
          <p className="mt-2">
            Prices are in Indian Rupees and include taxes. You can pay online by UPI, card or
            netbanking, or choose to pay on confirmation, where we send a payment link with your
            preview.
          </p>
          <p className="mt-2">
            You may cancel for a full refund any time before we start work on your item. Once
            drawing or printing has begun, the order cannot be cancelled.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">6. Delivery</h2>
          <p className="mt-2">
            We ship across India with tracking. Delivery is charged on every order. The amount
            depends on the item you have chosen and on the destination, and the exact figure is
            shown at checkout once you enter your state — nothing is added after you have paid.
            Delivery timelines are estimates from our courier partners and can be affected by
            weather, strikes and local restrictions. Please make sure the address and mobile number
            you give us are correct — a parcel returned because nobody could be reached will need
            the delivery paid again.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">7. Contacting you</h2>
          <p className="mt-2">
            We use your mobile number and email to send order updates and previews. If we still
            need your photograph, we will only call or message you about it when you have given
            permission at checkout.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">8. Getting in touch</h2>
          <p className="mt-2">
            Questions about an order or these terms:{" "}
            <a href={`mailto:${site.email}`} className="text-brand hover:underline">
              {site.email}
            </a>{" "}
            or WhatsApp{" "}
            <a
              href={`https://wa.me/${site.whatsapp}`}
              className="text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {site.phone}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-muted">
        See also our{" "}
        <Link href="/faq" className="text-brand hover:underline">
          frequently asked questions
        </Link>
        .
      </p>
    </div>
  );
}
