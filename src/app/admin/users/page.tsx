import Link from "next/link";
import { Plus, ShieldCheck, TriangleAlert, UserCheck, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_DAYS, activeSince } from "@/lib/active-users";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; deleted?: string }>;
}) {
  const { q, filter, deleted } = await searchParams;
  const search = (q ?? "").trim();
  const since = activeSince();

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
    ...(filter === "active" ? { lastLoginAt: { gte: since } } : {}),
    ...(filter === "requests" ? { deletionRequestedAt: { not: null } } : {}),
    ...(filter === "admins" ? { role: "ADMIN" as const } : {}),
  };

  const [total, active, admins, requests, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
    prisma.user.findMany({
      where,
      orderBy: [{ deletionRequestedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 200,
      // Explicit select: the password hash must never leave the database layer.
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        deletionRequestedAt: true,
        _count: { select: { orders: true, addresses: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Total users", value: total, icon: Users, href: "/admin/users" },
    {
      label: `Active (${ACTIVE_DAYS} days)`,
      value: active,
      icon: UserCheck,
      href: "/admin/users?filter=active",
    },
    { label: "Admins", value: admins, icon: ShieldCheck, href: "/admin/users?filter=admins" },
    {
      label: "Delete requests",
      value: requests,
      icon: TriangleAlert,
      href: "/admin/users?filter=requests",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Everyone with an account. Guests who checked out without signing in are not listed here.
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4" /> New user
          </Button>
        </Link>
      </div>

      {deleted ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          The account was deleted. Their past orders are kept as business records.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-2xl border bg-white p-5 transition-colors hover:border-brand ${
              stat.label === "Delete requests" && stat.value > 0
                ? "border-amber-400"
                : "border-line"
            }`}
          >
            <stat.icon
              className={`h-5 w-5 ${
                stat.label === "Delete requests" && stat.value > 0
                  ? "text-amber-600"
                  : "text-brand"
              }`}
            />
            <p className="mt-3 font-display text-2xl">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-3" action="/admin/users">
        {filter ? <input type="hidden" name="filter" value={filter} /> : null}
        <Input
          name="q"
          defaultValue={search}
          placeholder="Search by name, email or number"
          className="max-w-xs"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {search || filter ? (
          <Link href="/admin/users">
            <Button type="button" variant="ghost">
              Clear
            </Button>
          </Link>
        ) : null}
      </form>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        {users.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No accounts match that.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-cream text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Orders</th>
                  <th className="px-5 py-3">Last sign-in</th>
                  <th className="px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-cream/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/users/${user.id}`} className="font-medium hover:text-brand">
                        {user.name}
                      </Link>
                      {user.deletionRequestedAt ? (
                        <Badge tone="amber" className="ml-2">
                          Delete requested
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-muted">
                      {user.email}
                      {user.phone ? <span className="block text-xs">{user.phone}</span> : null}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={user.role === "ADMIN" ? "brand" : "neutral"}>{user.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{user._count.orders}</td>
                    <td className="px-5 py-3 text-muted">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : "—"}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        Active means signed in within the last {ACTIVE_DAYS} days. Showing up to 200 accounts —
        use the search to narrow it down.
      </p>
    </div>
  );
}
