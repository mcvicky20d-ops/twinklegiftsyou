import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/site-url";
import { absolute, jsonLdGraph, organizationSchema, webSiteSchema } from "@/lib/seo";
import "./globals.css";

// Only the weights the pages actually render. The variable faces ship every
// weight and italic, which cost ~188kB of font on first paint for four files.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal"],
});

// Headings inherit weight 400 under Tailwind's preflight, so one cut is enough.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400"],
  style: ["normal"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${site.name} — ${site.tagline} | Delivered across India`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: absolute("/") },
  keywords: [
    "pencil art",
    "pencil portrait",
    "pencil sketch from photo",
    "customised mugs",
    "personalised photo mug",
    "personalised photo frames",
    "custom gifts online India",
    "handmade gifts India",
    "anniversary gifts",
    "birthday gifts online",
    site.name,
  ],
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: absolute("/"),
    siteName: site.name,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  category: "shopping",
  formatDetection: { telephone: false, address: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {/* Site-wide identity, declared once so every page inherits it. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdGraph(organizationSchema(), webSiteSchema()),
          }}
        />
        {children}
      </body>
    </html>
  );
}
