"use client";

import { useActionState } from "react";
import { authenticate, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(authenticate, {} as LoginState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" autoFocus />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
