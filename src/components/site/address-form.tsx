"use client";

import * as React from "react";
import { useActionState } from "react";
import { saveAddress, type FormState } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export type AddressValues = {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const empty: AddressValues = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  isDefault: false,
};

export function AddressForm({
  initial,
  states,
  onDone,
}: {
  initial?: AddressValues;
  states: string[];
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveAddress, {} as FormState);
  const [values, setValues] = React.useState<AddressValues>(initial ?? empty);
  const errorFor = (field: string) => state?.fieldErrors?.[field]?.[0];

  // Closing the editor is the parent's business, so tell it once the action
  // comes back successful rather than reaching into its state from here.
  const saved = state?.ok === true;
  React.useEffect(() => {
    if (saved) onDone?.();
  }, [saved, onDone]);

  const set =
    (key: keyof AddressValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name this address" error={errorFor("label")} hint="Home, Office, Amma's place…">
          <Input name="label" required maxLength={40} value={values.label} onChange={set("label")} />
        </Field>
        <Field label="Who receives it" error={errorFor("fullName")}>
          <Input
            name="fullName"
            required
            minLength={2}
            autoComplete="name"
            value={values.fullName}
            onChange={set("fullName")}
          />
        </Field>
      </div>

      <Field label="Mobile number" error={errorFor("phone")} hint="10 digits, for the courier">
        <Input
          name="phone"
          required
          inputMode="numeric"
          pattern="[6-9][0-9]{9}"
          title="A 10-digit Indian mobile number starting 6, 7, 8 or 9"
          autoComplete="tel-national"
          value={values.phone}
          onChange={set("phone")}
        />
      </Field>

      <Field label="Address" error={errorFor("addressLine1")}>
        <Input
          name="addressLine1"
          required
          minLength={5}
          placeholder="House / street"
          autoComplete="address-line1"
          value={values.addressLine1}
          onChange={set("addressLine1")}
        />
      </Field>

      <Field label="Landmark / area (optional)">
        <Input
          name="addressLine2"
          autoComplete="address-line2"
          value={values.addressLine2}
          onChange={set("addressLine2")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" error={errorFor("city")}>
          <Input
            name="city"
            required
            minLength={2}
            autoComplete="address-level2"
            value={values.city}
            onChange={set("city")}
          />
        </Field>
        <Field label="State" error={errorFor("state")}>
          <Input
            name="state"
            required
            minLength={2}
            list="address-states"
            autoComplete="address-level1"
            value={values.state}
            onChange={set("state")}
          />
          <datalist id="address-states">
            {states.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </Field>
        <Field label="PIN code" error={errorFor("pincode")}>
          <Input
            name="pincode"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            title="A 6-digit PIN code"
            autoComplete="postal-code"
            value={values.pincode}
            onChange={set("pincode")}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          name="isDefault"
          checked={values.isDefault}
          onChange={(event) => setValues((v) => ({ ...v, isDefault: event.target.checked }))}
        />
        Use this as my default delivery address
      </label>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : values.id ? "Save changes" : "Save address"}
        </Button>
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
