import { Resend } from "resend";
import { formatPrice } from "@/lib/utils";

type OrderMail = {
  orderNumber: string;
  customerName: string;
  email: string;
  total: number;
  items: { title: string; quantity: number; unitPrice: number }[];
};

const from = process.env.RESEND_FROM ?? "TwinkleGiftsYou <onboarding@resend.dev>";

function client() {
  const key = process.env.RESEND_API_KEY;
  // Email is optional: without a key the site still works, it just stays quiet.
  return key ? new Resend(key) : null;
}

export async function sendOrderConfirmation(order: OrderMail) {
  const resend = client();
  if (!resend) return { skipped: true as const };

  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${item.title} × ${item.quantity}</td><td align="right">${formatPrice(
          item.unitPrice * item.quantity,
        )}</td></tr>`,
    )
    .join("");

  try {
    await resend.emails.send({
      from,
      to: order.email,
      subject: `Order ${order.orderNumber} received — TwinkleGiftsYou`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2>Thank you, ${order.customerName}!</h2>
          <p>We have received order <strong>${order.orderNumber}</strong> and will start on it shortly.</p>
          <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0">${rows}</table>
          <p><strong>Total: ${formatPrice(order.total)}</strong></p>
          <p style="color:#666;font-size:13px">We will WhatsApp you a preview before dispatch on customised items.</p>
        </div>`,
    });
    return { skipped: false as const };
  } catch (error) {
    console.error("Order email failed", error);
    return { skipped: true as const };
  }
}

export async function sendEnquiryNotification(enquiry: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const resend = client();
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!resend || !to) return { skipped: true as const };

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: enquiry.email,
      subject: `New enquiry: ${enquiry.subject}`,
      html: `<p><strong>${enquiry.name}</strong> (${enquiry.email})</p><p>${enquiry.message.replace(/\n/g, "<br/>")}</p>`,
    });
    return { skipped: false as const };
  } catch (error) {
    console.error("Enquiry email failed", error);
    return { skipped: true as const };
  }
}
