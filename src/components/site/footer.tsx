import Image from "next/image";
import Link from "next/link";
import { AtSign, Mail, Phone } from "lucide-react";
import { footerLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Image
            src="/brand/logo-wordmark.webp"
            alt={site.name}
            width={373}
            height={53}
            className="h-6 w-auto"
          />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{site.description}</p>
        </div>

        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-2 text-sm text-muted">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1 hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Reach us</p>
          <ul className="mt-2 text-sm text-muted">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${site.email}`} className="inline-block py-1 hover:text-brand">
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="inline-block py-1 hover:text-brand">
                {site.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              <a href={site.instagram} className="inline-block py-1 hover:text-brand">
                @twinklegiftsyou
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name} · {site.domain} · Made with care in India
      </div>
    </footer>
  );
}
