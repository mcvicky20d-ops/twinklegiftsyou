"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { site } from "@/lib/site";

const initialState: EnquiryState = { status: "idle" };

const emptyForm = { name: "", phone: "", email: "", subject: "", message: "" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialState);
  // React resets uncontrolled fields once a form action completes, so a
  // rejected message used to wipe everything the visitor had typed. Holding
  // the values here keeps them on the page to correct.
  const [values, setValues] = React.useState(emptyForm);
  // Derived rather than set from an effect: the popup is open whenever the
  // action succeeded and the visitor has not closed it.
  const [dismissed, setDismissed] = React.useState(false);
  const sent = state.status === "success";
  const showSuccess = sent && !dismissed;

  const set = (field: keyof typeof emptyForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const errorFor = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <>
      {sent ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-3 font-display text-2xl">Message sent</p>
          <p className="mt-2 text-sm text-muted">{state.message}</p>
        </div>
      ) : (
      <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" error={errorFor("name")}>
            <Input name="name" required minLength={2} value={values.name} onChange={set("name")} />
          </Field>
          <Field label="Phone (optional)" error={errorFor("phone")}>
            <Input name="phone" inputMode="tel" value={values.phone} onChange={set("phone")} />
          </Field>
        </div>

        <Field label="Email" error={errorFor("email")}>
          <Input name="email" type="email" required value={values.email} onChange={set("email")} />
        </Field>

        <Field label="Subject" error={errorFor("subject")}>
          <Input
            name="subject"
            required
            minLength={3}
            placeholder="Pencil portrait for an anniversary"
            value={values.subject}
            onChange={set("subject")}
          />
        </Field>

        <Field
          label="Message"
          error={errorFor("message")}
          hint="The occasion, the budget, and the photo you have in mind."
        >
          <Textarea
            name="message"
            required
            minLength={10}
            className="min-h-40"
            value={values.message}
            onChange={set("message")}
          />
        </Field>

        {state.status === "error" && state.message ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </form>
      )}

      {showSuccess ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sent-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDismissed(true);
          }}
        >
          <div className="w-full max-w-md rounded-t-2xl bg-white p-8 text-center shadow-xl sm:rounded-2xl">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Close"
                className="rounded-full p-2 text-muted hover:bg-blush"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 id="sent-title" className="mt-4 font-display text-2xl">
              Message sent
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Thank you — we reply to every message{" "}
              <strong className="text-ink">within 12 hours</strong>. Keep an eye on your email and
              WhatsApp.
            </p>

            {/* Stacked rather than side by side: the labels wrap badly in two
                narrow columns inside a modal. */}
            <div className="mt-6 space-y-2">
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="w-full">Send your photo on WhatsApp</Button>
              </a>
              <Button variant="outline" className="w-full" onClick={() => setDismissed(true)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
