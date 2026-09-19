"use client";

import * as React from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AddressForm, type AddressValues } from "@/components/site/address-form";
import { deleteAddress, makeDefaultAddress } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type SavedAddress = AddressValues & { id: string; reference: string };

export function AddressBook({
  addresses,
  states,
}: {
  addresses: SavedAddress[];
  states: string[];
}) {
  // null = nothing open, "new" = blank form, otherwise the id being edited.
  const [editing, setEditing] = React.useState<string | null>(null);
  const close = React.useCallback(() => setEditing(null), []);

  return (
    <div className="space-y-6">
      {addresses.length === 0 && editing === null ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <MapPin className="mx-auto h-6 w-6 text-brand" />
          <p className="mt-3 font-display text-xl">No saved addresses</p>
          <p className="mt-2 text-sm text-muted">
            Save one and checkout fills itself in — handy when you post gifts to different people.
          </p>
          <Button className="mt-6" onClick={() => setEditing("new")}>
            Add an address
          </Button>
        </div>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) =>
          editing === address.id ? (
            <li key={address.id} className="rounded-2xl border border-brand bg-white p-5 sm:col-span-2">
              <h2 className="mb-4 font-display text-lg">Edit address</h2>
              <AddressForm initial={address} states={states} onDone={close} />
            </li>
          ) : (
            <li key={address.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{address.label}</p>
                  <p className="text-xs text-muted">
                    Address ID <span className="font-mono">{address.reference}</span>
                  </p>
                </div>
                {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
              </div>

              <address className="mt-3 text-sm not-italic text-muted">
                {address.fullName}
                <br />
                {address.addressLine1}
                {address.addressLine2 ? (
                  <>
                    <br />
                    {address.addressLine2}
                  </>
                ) : null}
                <br />
                {address.city}, {address.state} {address.pincode}
                <br />
                {address.phone}
              </address>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(address.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-blush hover:text-brand"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>

                {address.isDefault ? null : (
                  <form action={makeDefaultAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-blush hover:text-brand"
                    >
                      <Star className="h-3.5 w-3.5" /> Make default
                    </button>
                  </form>
                )}

                <form
                  action={deleteAddress}
                  onSubmit={(event) => {
                    if (!confirm(`Delete the "${address.label}" address?`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={address.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </form>
              </div>
            </li>
          ),
        )}
      </ul>

      {editing === "new" ? (
        <div className="rounded-2xl border border-brand bg-white p-6">
          <h2 className="mb-4 font-display text-lg">New address</h2>
          <AddressForm states={states} onDone={close} />
        </div>
      ) : addresses.length > 0 ? (
        <Button variant="outline" onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> Add another address
        </Button>
      ) : null}
    </div>
  );
}
