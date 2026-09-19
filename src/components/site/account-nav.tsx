"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-px">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm transition-colors",
              active
                ? "border-b-2 border-brand font-medium text-ink"
                : "text-muted hover:text-brand",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
