import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  orderStatusTone,
  orderStatuses,
  paymentStatusTone,
} from "@/components/admin/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = orderStatuses.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted">{orders.length} matching orders</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full border border-line px-3.5 py-1.5 text-xs hover:bg-blush",
            !filter && "border-brand bg-brand text-white hover:bg-brand",
          )}
        >
          All
        </Link>
        {orderStatuses.map((value) => (
          <Link
            key={value}
            href={`/admin/orders?status=${value}`}
            className={cn(
              "rounded-full border border-line px-3.5 py-1.5 text-xs hover:bg-blush",
              filter === value && "border-brand bg-brand text-white hover:bg-brand",
            )}
          >
            {value.replace("_", " ")}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
          No orders here yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-3xl text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Items</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className="cursor-pointer hover:bg-cream">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:text-brand">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p>{order.customerName}</p>
                    <p className="text-xs text-muted">{order.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{order._count.items}</td>
                  <td className="px-5 py-3">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={paymentStatusTone(order.paymentStatus)}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={orderStatusTone(order.status)}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
