import QRCode from "qrcode";

/**
 * Direct UPI collection. The customer pays from any UPI app to the shop's own
 * VPA and quotes the reference back, which costs nothing per transaction —
 * unlike a gateway. Razorpay stays available for cards and netbanking.
 */
/**
 * Read at request time, not build time. A NEXT_PUBLIC_ variable is inlined
 * into the bundle by the compiler, so changing the shop's UPI ID would need a
 * rebuild. These are server-only and handed to the browser as props instead.
 */
export const upiConfig = {
  get vpa() {
    return process.env.UPI_ID ?? "";
  },
  get payee() {
    return process.env.UPI_PAYEE_NAME ?? "TwinkleGiftsYou";
  },
};

export function upiEnabled() {
  // A VPA always looks like name@handle; anything else would build a dead link.
  return /^[\w.\-]{2,}@[a-z]{2,}$/i.test(upiConfig.vpa);
}

/** Builds the `upi://pay` deep link that opens GPay, PhonePe, Paytm and the rest. */
export function upiPaymentLink(input: { amountPaise: number; orderNumber: string }) {
  const params = new URLSearchParams({
    pa: upiConfig.vpa,
    pn: upiConfig.payee,
    am: (input.amountPaise / 100).toFixed(2),
    cu: "INR",
    tn: `Order ${input.orderNumber}`,
  });
  return `upi://pay?${params.toString()}`;
}

/** QR for the same link, so desktop customers can scan with their phone. */
export async function upiQrDataUrl(link: string) {
  return QRCode.toDataURL(link, {
    width: 320,
    margin: 1,
    color: { dark: "#23201d", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

/** A UPI reference (UTR) is 12 digits; some banks show a longer alphanumeric id. */
export function looksLikeUpiReference(value: string) {
  return /^[A-Za-z0-9]{8,24}$/.test(value.trim());
}
