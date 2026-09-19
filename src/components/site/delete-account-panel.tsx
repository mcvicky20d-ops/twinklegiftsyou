"use client";

import * as React from "react";
import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";
import {
  cancelAccountDeletion,
  requestAccountDeletion,
  type UserFormState,
} from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { site } from "@/lib/site";

export function DeleteAccountPanel({ requestedAt }: { requestedAt: string | null }) {
  const [state, formAction, pending] = useActionState(requestAccountDeletion, {} as UserFormState);
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({ reason: "", confirm: "" });

  if (requestedAt) {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg text-amber-900">
          <TriangleAlert className="h-4 w-4" /> Account closure requested
        </h2>
        <p className="mt-2 text-sm text-amber-900">
          You asked us to close this account on {formatDate(requestedAt)}. We check these by hand so
          that any order still being made is finished first — usually within a couple of days.
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Need it sooner, or have a question? Message us on WhatsApp or email {site.email}.
        </p>
        <form action={cancelAccountDeletion} className="mt-4">
          <Button type="submit" variant="outline" size="sm">
            Changed my mind — keep my account
          </Button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h2 className="font-display text-lg">Close my account</h2>
      <p className="mt-2 text-sm text-muted">
        We remove your sign-in and saved addresses. Orders you have already placed stay in our
        records, because we are required to keep sales invoices.
      </p>

      {!open ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          Request account deletion
        </Button>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <Field label="Why are you leaving? (optional)" hint="It helps us improve">
            <Textarea
              name="reason"
              maxLength={500}
              value={values.reason}
              onChange={(event) => setValues((v) => ({ ...v, reason: event.target.value }))}
            />
          </Field>

          <Field
            label="Type DELETE to confirm"
            error={state?.fieldErrors?.confirm?.[0]}
            hint="This sends us a request; we close the account by hand"
          >
            <Input
              name="confirm"
              value={values.confirm}
              onChange={(event) => setValues((v) => ({ ...v, confirm: event.target.value }))}
            />
          </Field>

          {state?.error ? (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button type="submit" variant="danger" size="sm" disabled={pending}>
              {pending ? "Sending…" : "Send deletion request"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
