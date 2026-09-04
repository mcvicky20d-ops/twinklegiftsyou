"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, X } from "lucide-react";
import * as React from "react";
import { navigation, site } from "@/lib/site";
import { useCart } from "@/components/site/cart-provider";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label={`${site.name} home`}>
          <Image
            src="/brand/logo-wordmark.webp"
            alt={site.name}
            width={294}
            height={41}
            priority
            // Sized by height so the mark keeps its proportions in the bar.
            className="h-6 w-auto sm:h-7"
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm text-muted transition-colors hover:text-brand",
                pathname === item.href && "font-medium text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label={`Cart with ${ready ? count : 0} items`}
            className="relative rounded-full p-2 hover:bg-blush"
          >
            <ShoppingBag className="h-5 w-5" />
            {ready && count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            ) : null}
          </Link>
          <button
            className="rounded-full p-2 hover:bg-blush md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-line bg-cream px-4 py-3 md:hidden">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-2 py-2.5 text-sm text-ink hover:bg-blush"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`https://wa.me/${site.whatsapp}`}
            className="block rounded-lg px-2 py-2.5 text-sm text-brand"
          >
            WhatsApp us
          </a>
        </nav>
      ) : null}
    </header>
  );
}
