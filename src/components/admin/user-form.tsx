"use client";

import * as React from "react";
import { useActionState } from "react";
import { createUser, updateUser, type UserFormState } from "@/app/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";

type Props = {
  mode: "create" | "edit";
  user?: { id: string; name: string; email: string; phone: string; role: "ADMIN" | "CUSTOMER" };
  /** True when the account signs in with Google and has no password of its own. */
  passwordless?: boolean;
};

export function UserForm({ mode, user, passwordless }: Props) {
  const action = mode === "create" ? createUser : updateUser;
  const [state, formAction, pending] = useActionState(action, {} as UserFormState);
  const [values, setValues] = React.useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "CUSTOMER",
    password: "",
  });

  const errorFor = (field: string) => state?.fieldErrors?.[field]?.[0];
  const set =
    (key: keyof typeof values) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <form action={formAction} className="space-y-5">
      {user ? <input type="hidden" name="id" value={user.id} /> : null}

      <Field label="Name" error={errorFor("name")}>
        <Input name="name" required minLength={2} value={values.name} onChange={set("name")} />
      </Field>

      {mode === "create" ? (
        <Field label="Email" error={errorFor("email")}>
          <Input
            name="email"
            type="email"
            required
            value={values.email}
            onChange={set("email")}
          />
        </Field>
      ) : (
        <Field label="Email" hint="Sign-in address — change it in the database if it must move">
          <Input value={values.email} disabled readOnly />
        </Field>
      )}

      <Field label="Mobile number" error={errorFor("phone")} hint="Optional, 10 digits">
        <Input
          name="phone"
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
          value={values.phone}
          onChange={set("phone")}
        />
      </Field>

      <Field
        label="Role"
        error={errorFor("role")}
        hint="Admins can see this panel and every customer's details"
      >
        <Select name="role" value={values.role} onChange={set("role")}>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </Field>

      <Field
        label={mode === "create" ? "Password" : "New password"}
        error={errorFor("password")}
        hint={
          mode === "create"
            ? "At least 8 characters — share it with them privately"
            : passwordless
              ? "This account signs in with Google. Setting a password adds email sign-in too."
              : "Leave blank to keep their current password"
        }
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required={mode === "create"}
          minLength={8}
          value={values.password}
          onChange={set("password")}
        />
      </Field>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create account" : "Save changes"}
      </Button>
    </form>
  );
}
