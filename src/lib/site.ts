/**
 * Values still carrying the scaffold's dummy contact details. Anything listed
 * here is hidden from the site and left out of structured data, because
 * publishing a phone number nobody answers is worse than publishing none —
 * and Google treats contradictory contact data as a trust signal against you.
 * Replace the value and delete it from this list to make it appear.
 */
const PLACEHOLDERS = new Set(["+91 90000 00000", "919000000000"]);

export function isPlaceholder(value: string | undefined | null) {
  return !value || PLACEHOLDERS.has(value);
}

/** Returns the value only when it is real, so callers can skip it cleanly. */
export function real(value: string | undefined | null) {
  return isPlaceholder(value) ? undefined : (value as string);
}

export const site = {
  name: "TwinkleGiftsYou",
  domain: "twinklegiftsyou.in",
  tagline: "Handmade pencil art, customised mugs & photo frames",
  description:
    "TwinkleGiftsYou creates hand-drawn pencil portraits, customised mugs and personalised photo frames — thoughtful, made-to-order gifts shipped across India.",
  email: "hello@twinklegiftsyou.in",
  phone: "+91 86676 71772",
  whatsapp: "918667671772",
  instagram: "https://instagram.com/twinklegiftsyou",
  address: "Chennai, Tamil Nadu, India",
  city: "Chennai",
  region: "Tamil Nadu",
  country: "IN",
  founded: "2024",
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
