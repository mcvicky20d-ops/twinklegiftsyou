export const FREE_SHIPPING_ABOVE = 99900; // ₹999
export const SHIPPING_FEE = 7900; // ₹79

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
}
