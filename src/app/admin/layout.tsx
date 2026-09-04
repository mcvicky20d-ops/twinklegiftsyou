import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "Admin", ...noIndex };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white lg:block">
        <div className="p-6">
          <Link href="/" className="block">
            <Image
              src="/brand/logo-wordmark.webp"
              alt="TwinkleGiftsYou"
              width={373}
              height={53}
              className="h-6 w-auto"
            />
          </Link>
          <p className="mt-1 text-xs text-muted">Admin panel</p>
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:px-8">
          <div className="lg:hidden">
            <AdminNav compact />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{session.user.email}</span>
            <Link href="/" className="text-sm text-brand hover:underline">
              View site
            </Link>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
