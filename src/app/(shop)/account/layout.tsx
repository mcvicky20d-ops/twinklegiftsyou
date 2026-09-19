import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/site/account-nav";
import { signOutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">My account</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {session.user.email}
            {session.user.role === "ADMIN" ? (
              <>
                {" · "}
                <Link href="/admin" className="text-brand hover:underline">
                  Admin panel
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <form action={signOutAction}>
          <button type="submit" className="text-sm text-muted underline hover:text-brand">
            Sign out
          </button>
        </form>
      </div>

      <AccountNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
