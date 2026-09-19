import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/site/register-form";
import { GoogleButton } from "@/components/site/google-button";
import { auth, googleEnabled } from "@/lib/auth";
import { site } from "@/lib/site";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "Create an account", ...noIndex };

export const dynamic = "force-dynamic";

function safeCallback(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const target = safeCallback(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(target);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center">
          <Image
            src="/brand/logo-wordmark.webp"
            alt={site.name}
            width={294}
            height={41}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <h1 className="mt-4 text-center font-display text-2xl">Create your account</h1>
        <p className="mt-1 text-center text-sm text-muted">
          Save your addresses once and reorder in a couple of taps.
        </p>

        <div className="mt-8 space-y-5 rounded-2xl border border-line bg-white p-6">
          {googleEnabled() ? (
            <>
              <GoogleButton callbackUrl={target} />
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="h-px flex-1 bg-line" />
                or with email
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          ) : null}

          <RegisterForm callbackUrl={target} />
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(target)}`}
            className="text-brand hover:underline"
          >
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="hover:underline">
            terms
          </Link>
          . {site.domain}
        </p>
      </div>
    </div>
  );
}
