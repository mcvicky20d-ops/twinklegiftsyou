"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      // Sits above the WhatsApp button rather than beside it, so neither
      // covers the other on a narrow phone.
      className="fixed bottom-24 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md transition-colors hover:bg-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand print:hidden"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
