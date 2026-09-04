import Link from "next/link";
import type { Metadata } from "next";
import { faqPageSchema, faqs } from "@/lib/faq";
import { breadcrumbSchema, canonical, jsonLdGraph } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ — Delivery, Photos, Payment & Custom Orders",
  description:
    "How long personalised gifts take, what photo to send, delivery across India, payment options and bulk orders — answered.",
  ...canonical("/faq"),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(
            faqPageSchema(),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "FAQ", path: "/faq" },
            ]),
          ),
        }}
      />

      <h1 className="font-display text-4xl">Questions, answered</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Everything people usually ask before ordering. If yours is not here, message us — we reply
        within 12 hours.
      </p>

      <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-white">
        {faqs.map((faq) => (
          // <details> gives an accordion with keyboard support and no JavaScript.
          <details key={faq.question} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden">
              {faq.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-xl leading-none text-brand transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-blush p-8 text-center">
        <h2 className="font-display text-2xl">Still deciding?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Send us the photo and the occasion. We will tell you what suits it and what it costs,
          before you commit to anything.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">
            <Button>Ask on WhatsApp</Button>
          </a>
          <Link href="/contact">
            <Button variant="outline">Send a message</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
