"use client";

import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";

const initialState: EnquiryState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitEnquiry, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="font-display text-2xl">Message sent</p>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" hint={state.fieldErrors?.name?.[0]}>
          <Input name="name" required />
        </Field>
        <Field label="Phone (optional)" hint={state.fieldErrors?.phone?.[0]}>
          <Input name="phone" inputMode="tel" />
        </Field>
      </div>
      <Field label="Email" hint={state.fieldErrors?.email?.[0]}>
        <Input name="email" type="email" required />
      </Field>
      <Field label="Subject" hint={state.fieldErrors?.subject?.[0]}>
        <Input name="subject" required placeholder="Pencil portrait for an anniversary" />
      </Field>
      <Field label="Message" hint={state.fieldErrors?.message?.[0]}>
        <Textarea name="message" required className="min-h-40" />
      </Field>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
