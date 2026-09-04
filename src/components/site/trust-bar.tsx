import { PencilLine, ShieldCheck, Sparkles, Truck } from "lucide-react";

/** Only claims things the shop actually does elsewhere on the site. */
const points = [
  { icon: PencilLine, title: "Drawn by hand", body: "Never a filter or a print-on-demand template" },
  { icon: Sparkles, title: "Preview first", body: "You approve a photo before it ships" },
  { icon: Truck, title: "All-India delivery", body: "Tracked and padded, charged by destination" },
  { icon: ShieldCheck, title: "Secure checkout", body: "UPI, cards and netbanking via Razorpay" },
];

export function TrustBar() {
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((point) => (
          <div key={point.title} className="flex items-start gap-3">
            <point.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">{point.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{point.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
