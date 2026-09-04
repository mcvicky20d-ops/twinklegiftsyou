/**
 * Delivery is charged on every order — there is no free threshold.
 *
 * A cart pays the highest delivery fee among its items, plus a surcharge for
 * the destination zone. Highest-rather-than-sum because the shop posts one
 * parcel: charging per item would overcharge anyone buying two mugs.
 */
export const DEFAULT_SHIPPING_FEE = 7900; // ₹79

export type ShippingLine = { shippingFee: number; quantity: number };

export type ShippingZoneRule = {
  name: string;
  fee: number;
  states: string[];
  isDefault: boolean;
};

/** Loose match so "tamil nadu", "Tamil Nadu " and "TAMILNADU" all land. */
function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function findZone(zones: ShippingZoneRule[], state: string | undefined) {
  const target = normalise(state ?? "");
  if (target) {
    const match = zones.find((zone) => zone.states.some((s) => normalise(s) === target));
    if (match) return match;
  }
  return zones.find((zone) => zone.isDefault) ?? null;
}

export type ShippingQuote = {
  /** Highest per-item delivery fee in the cart. */
  base: number;
  /** Destination surcharge. */
  zoneFee: number;
  zoneName: string | null;
  total: number;
  /** False until a recognised state narrows it down, so the UI can say "from". */
  resolved: boolean;
};

export function quoteShipping(
  items: ShippingLine[],
  zones: ShippingZoneRule[],
  state?: string,
): ShippingQuote {
  if (items.length === 0) {
    return { base: 0, zoneFee: 0, zoneName: null, total: 0, resolved: true };
  }

  const base = Math.max(...items.map((item) => item.shippingFee));
  const zone = findZone(zones, state);
  const matchedByState = Boolean(
    state && zone && zone.states.some((s) => normalise(s) === normalise(state)),
  );

  return {
    base,
    zoneFee: zone?.fee ?? 0,
    zoneName: zone?.name ?? null,
    total: base + (zone?.fee ?? 0),
    resolved: matchedByState || Boolean(state && zone?.isDefault),
  };
}
