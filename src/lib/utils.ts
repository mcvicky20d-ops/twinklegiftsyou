import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prices are stored in paise. Render them as ₹1,299 (no decimals unless needed). */
export function formatPrice(paise: number) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function rupeesToPaise(rupees: number | string) {
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise: number) {
  return paise / 100;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}

export function newOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TGY-${stamp}${noise}`;
}
