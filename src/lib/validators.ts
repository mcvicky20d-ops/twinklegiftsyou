import { z } from "zod";

/** Shared address rules, reused by checkout and the saved address book. */
const phoneRule = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your name").max(80),
    email: z.string().email("Enter a valid email"),
    phone: z.union([phoneRule, z.literal("")]).optional(),
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Both passwords must match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  label: z.string().min(1, "Give this address a name").max(40),
  fullName: z.string().min(2, "Please enter a name").max(80),
  phone: phoneRule,
  addressLine1: z.string().min(5, "Enter the address").max(160),
  addressLine2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(2, "Enter the city").max(60),
  state: z.string().min(2, "Enter the state").max(60),
  pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  isDefault: z.boolean().optional(),
});

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
  paymentMethod: z.enum(["RAZORPAY", "UPI", "PENDING"]),
  acceptedTerms: z.literal(true, { message: "Please accept the terms to continue" }),

  /// A gift is delivered to someone other than the buyer, so the parcel needs
  /// the recipient's name and number and the card needs a message.
  isGift: z.boolean().optional(),
  recipientName: z.string().max(80).optional().or(z.literal("")),
  recipientPhone: z.union([phoneRule, z.literal("")]).optional(),
  giftMessage: z.string().max(400).optional().or(z.literal("")),

  /// The saved address this was filled from, and whether to keep a new one.
  addressId: z.string().max(40).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
  saveAddressLabel: z.string().max(40).optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (!value.isGift) return;
  if ((value.recipientName ?? "").trim().length < 2) {
    ctx.addIssue({
      code: "custom",
      path: ["recipientName"],
      message: "Who is the gift for?",
    });
  }
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
export type AddressInput = z.infer<typeof addressSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
