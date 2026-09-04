"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEnquiryNotification } from "@/lib/mail";
import { enquirySchema } from "@/lib/validators";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the fields marked in red below.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;

  await prisma.enquiry.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    },
  });

  await sendEnquiryNotification(data);

  return { status: "success", message: "Thank you — we reply within 12 hours." };
}
