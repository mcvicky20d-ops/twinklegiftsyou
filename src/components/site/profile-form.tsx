"use client";

import * as React from "react";
import { useActionState } from "react";
import { updateProfile, type FormState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, {} as FormState);
  const [values, setValues] = React.useState({ name, phone });
  const errorFor = (field: string) => state?.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <Field label="Name" error={errorFor("name")}>
        <Input
          name="name"
          required
          minLength={2}
          autoComplete="name"
          value={values.name}
          onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
        />
      </Field>
      <Field label="Mobile number" error={errorFor("phone")}>
        <Input
          name="phone"
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
          autoComplete="tel-national"
          value={values.phone}
          onChange={(event) => setValues((v) => ({ ...v, phone: event.target.value }))}
        />
      </Field>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}

      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
