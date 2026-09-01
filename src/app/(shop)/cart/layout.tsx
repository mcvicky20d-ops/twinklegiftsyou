import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";

// The cart page itself is a client component and cannot export metadata.
export const metadata: Metadata = { title: "Your bag", ...noIndex };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
