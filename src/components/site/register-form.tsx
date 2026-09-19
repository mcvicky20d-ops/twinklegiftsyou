"use client";

import * as React from "react";
import { useActionState } from "react";
import { register, type FormState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(register, {} as FormState);
  // React 19 resets uncontrolled inputs once a form action settles, which would
  // wipe everything typed the moment a single field is rejected.
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((previous) => ({ ...previous, [key]: event.target.value }));
  const errorFor = (field: string) => state?.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field label="Your name" error={errorFor("name")}>
        <Input
          name="name"
          required
          minLength={2}
          autoComplete="name"
          value={values.name}
          onChange={set("name")}
        />
      </Field>

      <Field label="Email" error={errorFor("email")}>
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={set("email")}
        />
      </Field>

      <Field label="Mobile number (optional)" error={errorFor("phone")} hint="For delivery updates">
        <Input
          name="phone"
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
          autoComplete="tel-national"
          value={values.phone}
          onChange={set("phone")}
        />
      </Field>

      <Field label="Password" error={errorFor("password")} hint="At least 8 characters">
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={values.password}
          onChange={set("password")}
        />
      </Field>

      <Field label="Confirm password" error={errorFor("confirmPassword")}>
        <Input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={set("confirmPassword")}
        />
      </Field>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
