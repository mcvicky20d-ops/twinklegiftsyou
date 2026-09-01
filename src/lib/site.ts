export const site = {
  name: "TwinkleGiftsYou",
  domain: "twinklegiftsyou.in",
  tagline: "Handmade pencil art, customised mugs & photo frames",
  description:
    "TwinkleGiftsYou creates hand-drawn pencil portraits, customised mugs and personalised photo frames — thoughtful, made-to-order gifts shipped across India.",
  email: "hello@twinklegiftsyou.in",
  phone: "+91 90000 00000",
  whatsapp: "919000000000",
  instagram: "https://instagram.com/twinklegiftsyou",
  address: "Chennai, Tamil Nadu, India",
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
