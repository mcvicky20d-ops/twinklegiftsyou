import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${site.name} — handmade pencil art and personalised gifts.`,
};

const steps = [
  { step: "01", title: "Send the photo", body: "WhatsApp or email the picture you want us to work from. Clear faces and good light give the best result." },
  { step: "02", title: "We sketch a plan", body: "You get a quote, a size recommendation and an idea of how the finished piece will look." },
  { step: "03", title: "It gets made", body: "Pencil work is drawn by hand; mugs and frames are printed and assembled in small batches." },
  { step: "04", title: "Approve, then ship", body: "A photo of the finished piece reaches you first. Only after you say yes does it get packed." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="font-display text-4xl">About {site.name}</h1>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
        <p>
          {site.name} started with a single graphite pencil and a request from a friend — a
          portrait of her grandmother, drawn from a faded photo. That one sketch turned into a
          small studio that now makes pencil portraits, customised mugs and personalised photo
          frames for people all over India.
        </p>
        <p>
          Everything is made to order. Nothing sits in a warehouse waiting for a buyer, which
          means every piece is drawn, printed or assembled specifically for the person you are
          gifting it to.
        </p>
      </div>

      <h2 className="mt-14 font-display text-2xl">How an order works</h2>
      <ol className="mt-6 grid gap-5 sm:grid-cols-2">
        {steps.map((item) => (
          <li key={item.step} className="rounded-2xl border border-line bg-white p-6">
            <span className="font-display text-2xl text-brand">{item.step}</span>
            <p className="mt-2 font-medium">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-14 rounded-2xl bg-blush p-8 text-center">
        <h2 className="font-display text-2xl">Ready when you are</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Tell us the occasion and we will suggest something that fits the budget.
        </p>
        <Link href="/contact" className="mt-6 inline-block">
          <Button size="lg">Get in touch</Button>
        </Link>
      </div>
    </div>
  );
}
