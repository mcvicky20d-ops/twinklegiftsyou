import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const categories = [
  {
    name: "Pencil Art",
    slug: "pencil-art",
    description: "Hand-drawn graphite portraits from your photographs.",
    image: "/samples/pencil-portrait.svg",
    sortOrder: 1,
  },
  {
    name: "Customised Mugs",
    slug: "customised-mugs",
    description: "Ceramic mugs printed with names, photos and inside jokes.",
    image: "/samples/custom-mug.svg",
    sortOrder: 2,
  },
  {
    name: "Photo Frames",
    slug: "photo-frames",
    description: "Wooden and acrylic frames built around your favourite moment.",
    image: "/samples/photo-frame.svg",
    sortOrder: 3,
  },
];

const products = [
  {
    categorySlug: "pencil-art",
    title: "Single Portrait Pencil Sketch — A4",
    slug: "single-portrait-pencil-sketch-a4",
    images: ["/samples/pencil-portrait.svg"],
    description:
      "A hand-drawn graphite portrait of one person on 300gsm acid-free paper, A4 size.\n\nSend us a clear, well-lit photograph and we will sketch it by hand. Takes 5–7 working days. Ships rolled in a hard tube, or add a frame at checkout.",
    price: 129900,
    comparePrice: 159900,
    stock: 25,
    isFeatured: true,
    customNote: "Send a clear, front-facing photo — good light makes a big difference.",
  },
  {
    categorySlug: "pencil-art",
    title: "Couple Portrait Pencil Sketch — A3",
    slug: "couple-portrait-pencil-sketch-a3",
    images: ["/samples/pencil-portrait.svg"],
    description:
      "Two people, one sketch, A3 size. Perfect for anniversaries and weddings.\n\nDrawn entirely by hand over roughly a week. You approve a photo of the finished drawing before it is packed and shipped.",
    price: 249900,
    comparePrice: 299900,
    stock: 15,
    isFeatured: true,
    customNote: "Share both photos, or one photo with both people in it.",
  },
  {
    categorySlug: "customised-mugs",
    title: "Personalised Photo Mug — 330ml",
    slug: "personalised-photo-mug-330ml",
    images: ["/samples/custom-mug.svg"],
    description:
      "A glossy white ceramic mug printed with your photo and message. Dishwasher-safe print, 330ml capacity.\n\nDispatched in 3–4 working days in a padded box.",
    price: 39900,
    comparePrice: 49900,
    stock: 60,
    isFeatured: true,
    customNote: "Tell us the name or message to print, exactly as you want it.",
  },
  {
    categorySlug: "customised-mugs",
    title: "Magic Colour-Changing Mug",
    slug: "magic-colour-changing-mug",
    images: ["/samples/custom-mug.svg"],
    description:
      "Black on the outside until hot coffee reveals your photo. Always a good reaction.\n\nHand wash recommended to keep the effect crisp.",
    price: 54900,
    stock: 40,
    isFeatured: false,
    customNote: "Bright, high-contrast photos work best for the reveal.",
  },
  {
    categorySlug: "photo-frames",
    title: "Engraved Wooden Photo Frame — 8×10",
    slug: "engraved-wooden-photo-frame-8x10",
    images: ["/samples/photo-frame.svg"],
    description:
      "Solid wood frame with your photo and a laser-engraved name or date on the base.\n\nComes ready to stand or hang, packed in a gift box.",
    price: 89900,
    comparePrice: 109900,
    stock: 30,
    isFeatured: true,
    customNote: "Give us the exact text and date for the engraving.",
  },
  {
    categorySlug: "photo-frames",
    title: "Collage Photo Frame — 6 Photos",
    slug: "collage-photo-frame-6-photos",
    images: ["/samples/photo-frame.svg"],
    description:
      "Six of your favourite photographs arranged in one frame — a year, a trip or a friendship in a single piece.",
    price: 119900,
    stock: 20,
    isFeatured: false,
    customNote: "Send six photos and tell us the order you want them in.",
  },
];

const gallery = [
  { title: "Grandmother, from a 1974 photo", tag: "Pencil Art", caption: "Graphite on 300gsm paper, A3", image: "/samples/pencil-portrait.svg" },
  { title: "Wedding portrait", tag: "Pencil Art", caption: "Commissioned for a first anniversary", image: "/samples/pencil-portrait.svg" },
  { title: "Anniversary mug pair", tag: "Customised Mugs", caption: "Matching mugs with a shared date", image: "/samples/custom-mug.svg" },
  { title: "Engraved teak frame", tag: "Photo Frames", caption: "Laser-engraved names on the base", image: "/samples/photo-frame.svg" },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@twinklegiftsyou.in").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      name: process.env.ADMIN_NAME ?? "TwinkleGiftsYou Admin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const product of products) {
    const { categorySlug, ...rest } = product;
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: categorySlug } });
    await prisma.product.upsert({
      where: { slug: rest.slug },
      update: { ...rest, categoryId: category.id },
      create: { ...rest, categoryId: category.id },
    });
  }

  // Gallery items have no natural key, so only seed them into an empty gallery.
  if ((await prisma.galleryItem.count()) === 0) {
    await prisma.galleryItem.createMany({
      data: gallery.map((item, index) => ({
        ...item,
        // Local placeholder art, so the gallery never depends on a third-party
        // image host being reachable.
        imageUrl: item.image,
        sortOrder: index,
      })),
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
