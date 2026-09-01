import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export const orderStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const paymentStatuses: PaymentStatus[] = ["UNPAID", "PAID", "COD", "REFUNDED"];

export function orderStatusTone(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return "green";
    case "SHIPPED":
      return "blue";
    case "CANCELLED":
      return "red";
    case "PENDING":
      return "amber";
    default:
      return "brand";
  }
}

export function paymentStatusTone(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return "green";
    case "REFUNDED":
      return "red";
    case "COD":
      return "blue";
    default:
      return "amber";
  }
}
