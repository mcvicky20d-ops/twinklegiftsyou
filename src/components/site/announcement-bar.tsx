import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_ABOVE } from "@/lib/pricing";

/** Reads the real threshold so the banner can never contradict checkout. */
export function AnnouncementBar() {
  return (
    <div className="bg-ink px-4 py-2 text-center text-xs text-cream sm:text-sm">
      Free shipping across India on orders above {formatPrice(FREE_SHIPPING_ABOVE)} · Made to order,
      preview before dispatch
    </div>
  );
}
