"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/admin-users";
import { Input } from "@/components/ui/input";

/**
 * Deleting an account cannot be undone, so it sits behind typing the person's
 * name — enough friction that it cannot happen from a mis-tap.
 */
export function DeleteUserPanel({
  id,
  name,
  blocked,
  orderCount,
}: {
  id: string;
  name: string;
  blocked: "self" | "lastAdmin" | null;
  orderCount: number;
}) {
  const [typed, setTyped] = React.useState("");
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

  if (blocked) {
    return (
      <section className="rounded-2xl border border-line bg-white p-5 text-sm">
        <h2 className="font-display text-lg">Delete account</h2>
        <p className="mt-2 text-muted">
          {blocked === "self"
            ? "You cannot delete the account you are signed in with. Ask another admin, or sign in as one."
            : "This is the only admin account. Promote another admin first, then delete this one."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-5 text-sm">
      <h2 className="font-display text-lg text-red-700">Delete account</h2>
      <p className="mt-2 text-muted">
        Removes their sign-in, Google link and saved addresses. This cannot be undone.
      </p>
      <p className="mt-2 text-muted">
        {orderCount > 0
          ? `Their ${orderCount} order${orderCount > 1 ? "s stay" : " stays"} in the shop's records, with the name and address already on the order.`
          : "This account has no orders."}
      </p>

      <form action={deleteUser} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={id} />
        <label className="block text-xs text-muted">
          Type <strong className="text-ink">{name}</strong> to confirm
          <Input
            className="mt-1"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            aria-label={`Type ${name} to confirm deletion`}
          />
        </label>
        <button
          type="submit"
          disabled={!matches}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" /> Delete this account
        </button>
      </form>
    </section>
  );
}
