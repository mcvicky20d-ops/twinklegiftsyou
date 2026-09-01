import type { Metadata } from "next";
import { AtSign, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { ContactForm } from "@/components/site/contact-form";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact & Custom Orders",
  description:
    "Start a custom order or ask us anything about pencil portraits, customised mugs and personalised photo frames. We ship across India.",
  ...canonical("/contact"),
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="font-display text-4xl">Let&apos;s make something</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Tell us the occasion, the budget and the photo you have in mind. We will come back with a
        quote and a timeline.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <ContactForm />

        <aside className="space-y-5 text-sm">
          <a
            href={`https://wa.me/${site.whatsapp}`}
            className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 hover:border-brand"
          >
            <MessageCircle className="mt-0.5 h-5 w-5 text-brand" />
            <span>
              <span className="block font-medium">WhatsApp</span>
              <span className="block text-muted">Fastest way to send photos</span>
            </span>
          </a>
          <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-brand" />
              <a href={`mailto:${site.email}`} className="hover:text-brand">
                {site.email}
              </a>
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-brand" />
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-brand">
                {site.phone}
              </a>
            </p>
            <p className="flex items-start gap-3">
              <AtSign className="mt-0.5 h-4 w-4 text-brand" />
              <a href={site.instagram} className="hover:text-brand">
                @twinklegiftsyou
              </a>
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-brand" />
              <span className="text-muted">{site.address}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
