import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl">We could not find that page</h1>
      <p className="mt-2 text-sm text-muted">It may have been moved, or the link is out of date.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button>Back home</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Browse the shop</Button>
        </Link>
      </div>
    </div>
  );
}
