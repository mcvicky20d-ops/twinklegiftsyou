import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { updateEnquiryStatus } from "@/app/actions/admin";
import type { EnquiryStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const statuses: EnquiryStatus[] = ["NEW", "READ", "REPLIED", "CLOSED"];

const tones: Record<EnquiryStatus, string> = {
  NEW: "amber",
  READ: "blue",
  REPLIED: "green",
  CLOSED: "neutral",
};

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Enquiries</h1>
        <p className="mt-1 text-sm text-muted">Messages from the contact form.</p>
      </div>

      {enquiries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-sm text-muted">
          No enquiries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enquiry) => (
            <article key={enquiry.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{enquiry.subject}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {enquiry.name} ·{" "}
                    <a href={`mailto:${enquiry.email}`} className="hover:text-brand">
                      {enquiry.email}
                    </a>
                    {enquiry.phone ? ` · ${enquiry.phone}` : ""}
                  </p>
                  <p className="text-xs text-muted">{formatDate(enquiry.createdAt)}</p>
                </div>
                <Badge tone={tones[enquiry.status]}>{enquiry.status}</Badge>
              </div>

              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted">
                {enquiry.message}
              </p>

              <form action={updateEnquiryStatus} className="mt-4 flex items-center gap-2">
                <input type="hidden" name="id" value={enquiry.id} />
                <Select name="status" defaultValue={enquiry.status} className="w-40">
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="outline">
                  Update
                </Button>
                <a
                  href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(enquiry.subject)}`}
                  className="ml-auto text-sm text-brand hover:underline"
                >
                  Reply by email
                </a>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
