import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  neutral: "bg-line/60 text-ink",
  brand: "bg-blush text-brand-dark",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  red: "bg-red-100 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones | string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone] ?? tones.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
}
