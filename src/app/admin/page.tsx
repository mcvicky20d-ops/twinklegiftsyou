import Link from "next/link";
import { IndianRupee, MessageSquare, Package, ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { orderStatusTone } from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [orderCount, productCount, newEnquiries, paid, recentOrders, lowStock] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 3 } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Revenue collected", value: formatPrice(paid._sum.total ?? 0), icon: IndianRupee },
    { label: "Orders", value: orderCount, icon: ShoppingCart },
    { label: "Active products", value: productCount, icon: Package },
    { label: "New enquiries", value: newEnquiries, icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Everything happening in the shop right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-white p-5">
            <stat.icon className="h-5 w-5 text-brand" />
            <p className="mt-3 font-display text-2xl">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand hover:underline">
              All orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-cream"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted">
                        {order.orderNumber} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
                      <span className="text-sm">{formatPrice(order.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg">Running low</h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">Stock looks healthy.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between px-5 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="truncate text-sm hover:text-brand"
                  >
                    {product.title}
                  </Link>
                  <Badge tone={product.stock === 0 ? "red" : "amber"}>{product.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
