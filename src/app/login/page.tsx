import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { site } from "@/lib/site";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "Sign in", ...noIndex };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center">
          <Image
            src="/brand/logo-wordmark.webp"
            alt={site.name}
            width={373}
            height={53}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <p className="mt-2 text-center text-sm text-muted">Admin sign in</p>

        <div className="mt-8 rounded-2xl border border-line bg-white p-6">
          <LoginForm callbackUrl={callbackUrl ?? "/admin"} />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {site.domain} · staff access only
        </p>
      </div>
    </div>
  );
}
