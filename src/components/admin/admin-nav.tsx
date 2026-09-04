"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardDrive,
  Truck,
  Images,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingCart,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/shipping", label: "Delivery", icon: Truck },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/library", label: "Library", icon: HardDrive },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare },
];

export function AdminNav({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  if (compact) {
    return (
      <nav className="flex gap-1 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full p-2 text-muted",
              pathname === link.href && "bg-blush text-brand",
            )}
            aria-label={link.label}
          >
            <link.icon className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1 px-3 pb-6">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-blush hover:text-brand-dark",
              active && "bg-blush font-medium text-brand-dark",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
