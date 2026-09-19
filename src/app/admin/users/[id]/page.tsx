import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift, MapPin, TriangleAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/admin/user-form";
import { DeleteUserPanel } from "@/components/admin/delete-user-panel";
import { dismissDeletionRequest } from "@/app/actions/admin-users";
import { orderStatusTone } from "@/components/admin/order-status";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id },
    // The password hash is never selected, so it cannot reach the page at all.
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      image: true,
      createdAt: true,
      lastLoginAt: true,
      deletionRequestedAt: true,
      deletionReason: true,
      passwordHash: false,
      accounts: { select: { provider: true } },
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
    },
  });
  if (!user) notFound();

  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  const isSelf = session?.user.id === user.id;
  const lastAdmin = user.role === "ADMIN" && admins <= 1;
  const spent = await prisma.order.aggregate({
    _sum: { total: true },
    where: { userId: user.id, paymentStatus: "PAID" },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {user.email}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>{user.role}</Badge>
          {isSelf ? <Badge tone="blue">This is you</Badge> : null}
        </div>
      </div>

      {user.deletionRequestedAt ? (
        <section className="rounded-2xl border border-amber-400 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-amber-900">
            <TriangleAlert className="h-4 w-4" /> Account closure requested
          </h2>
          <p className="mt-2 text-sm text-amber-900">
            Asked on {formatDate(user.deletionRequestedAt)}.
            {user.deletionReason ? <> Reason: “{user.deletionReason}”</> : " No reason given."}
          </p>
          <p className="mt-2 text-sm text-amber-800">
            Finish or refund any order still in progress before deleting. Deleting removes their
            sign-in and saved addresses; past orders stay as your business record.
          </p>
          <form action={dismissDeletionRequest} className="mt-4">
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="rounded-full border border-amber-500 px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Dismiss the request (keep the account)
            </button>
          </form>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6">
            <h2 className="mb-4 font-display text-lg">Details</h2>
            <UserForm
              mode="edit"
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone ?? "",
                role: user.role,
              }}
              passwordless={user.accounts.length > 0}
            />
          </section>

          <section className="rounded-2xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-4 font-display text-lg">
              Orders ({user.orders.length})
            </h2>
            {user.orders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No orders from this account.</p>
            ) : (
              <ul className="divide-y divide-line">
                {user.orders.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium hover:text-brand"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-xs text-muted">
                        {formatDate(order.createdAt)} · {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                        {order.isGift ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-brand">
                            <Gift className="h-3 w-3" /> gift for {order.recipientName}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={orderStatusTone(order.status)}>
                        {order.status.replace("_", " ")}
                      </Badge>
                      <span className="text-sm">{formatPrice(order.total)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white">
            <h2 className="border-b border-line px-5 py-4 font-display text-lg">
              Saved addresses ({user.addresses.length})
            </h2>
            {user.addresses.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No saved addresses.</p>
            ) : (
              <ul className="divide-y divide-line">
                {user.addresses.map((address) => (
                  <li key={address.id} className="px-5 py-4 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-brand" />
                      {address.label}
                      <span className="font-mono text-xs text-muted">{address.reference}</span>
                      {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                    </p>
                    <p className="mt-1 text-muted">
                      {address.fullName} · {address.phone}
                      <br />
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city},{" "}
                      {address.state} — {address.pincode}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-5 text-sm">
            <h2 className="font-display text-lg">Account</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Joined</dt>
                <dd>{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Last sign-in</dt>
                <dd>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Signs in with</dt>
                <dd className="text-right">
                  {[
                    user.accounts.length > 0 ? "Google" : null,
                    user.accounts.length === 0 ? "Email & password" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Paid to date</dt>
                <dd>{formatPrice(spent._sum.total ?? 0)}</dd>
              </div>
            </dl>
          </section>

          <DeleteUserPanel
            id={user.id}
            name={user.name}
            blocked={isSelf ? "self" : lastAdmin ? "lastAdmin" : null}
            orderCount={user.orders.length}
          />
        </div>
      </div>
    </div>
  );
}
