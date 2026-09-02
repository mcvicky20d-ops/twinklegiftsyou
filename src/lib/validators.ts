import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  addressLine1: z.string().min(5, "Enter your address").max(160),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(2).max(60),
  state: z.string().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  notes: z.string().max(600).optional().or(z.literal("")),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  acceptedTerms: z.literal(true, { message: "Please accept the terms to continue" }),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  customisationMode: z
    .enum(["NONE", "TEXT_ONLY", "IMAGE_ONLY", "TEXT_AND_IMAGE"])
    .optional(),
  customText: z.string().max(300).optional(),
  customImageUrl: z.string().max(500).optional(),
});

export const imageDeliverySchema = z.object({
  imageDelivery: z.enum(["NOT_NEEDED", "UPLOADED", "WHATSAPP", "CONTACT_ME"]),
  contactConsent: z.boolean(),
});

export const enquirySchema = z.object({
  name: z.string().min(2, "Please enter your name").max(80),
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(20).optional().or(z.literal("")),
  subject: z.string().min(3, "What is this about?").max(120),
  message: z.string().min(10, "Tell us a little more").max(2000),
});

export const productSchema = z.object({
  title: z.string().min(2).max(140),
  slug: z.string().min(2).max(160),
  description: z.string().min(10),
  price: z.number().int().min(0),
  comparePrice: z.number().int().min(0).nullable(),
  categoryId: z.string().min(1, "Pick a category"),
  images: z.array(z.string().url()).max(6),
  stock: z.number().int().min(0),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  customizable: z.boolean(),
  customNote: z.string().max(200).nullable(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
