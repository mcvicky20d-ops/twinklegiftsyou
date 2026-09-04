import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteShippingZone, saveShippingZone } from "@/app/actions/admin";
import { formatPrice, paiseToRupees } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminShippingPage() {
  const [zones, products] = await Promise.all([
    prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({
      select: { id: true, title: true, shippingFee: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const hasDefault = zones.some((zone) => zone.isDefault);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Delivery charges</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          An order pays the highest delivery fee among its items — one parcel, charged once — plus
          the surcharge for the destination below.
        </p>
      </div>

      {!hasDefault ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          No zone is marked as the fallback. States you have not listed will be charged no
          surcharge at all until one is.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {zones.map((zone) => (
            <form
              key={zone.id}
              action={saveShippingZone}
              className="space-y-4 rounded-2xl border border-line bg-white p-5"
            >
              <input type="hidden" name="id" value={zone.id} />
              <div className="flex items-center justify-between">
                <p className="font-display text-lg">{zone.name}</p>
                <div className="flex items-center gap-2">
                  {zone.isDefault ? <Badge tone="brand">Fallback</Badge> : null}
                  <Badge tone="neutral">+{formatPrice(zone.fee)}</Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_120px_100px]">
                <Field label="Zone name">
                  <Input name="name" defaultValue={zone.name} required />
                </Field>
                <Field label="Surcharge (₹)">
                  <Input
                    name="fee"
                    type="number"
                    min={0}
                    defaultValue={paiseToRupees(zone.fee)}
                  />
                </Field>
                <Field label="Order">
                  <Input name="sortOrder" type="number" defaultValue={zone.sortOrder} />
                </Field>
              </div>

              <Field label="States" hint="One per line. Spelling is matched loosely.">
                <Textarea name="states" defaultValue={zone.states.join("\n")} />
              </Field>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="isDefault" defaultChecked={zone.isDefault} />
                Use for any state not listed anywhere
              </label>

              <div className="flex items-center justify-between">
                <Button type="submit" size="sm">
                  Save
                </Button>
                <DeleteButton
                  action={deleteShippingZone}
                  id={zone.id}
                  confirmText={`Delete the ${zone.name} zone?`}
                />
              </div>
            </form>
          ))}

          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-display text-lg">Delivery fee per product</h2>
            <p className="mt-1 text-sm text-muted">
              Edit these on each product. Shown here so you can compare them at a glance.
            </p>
            <ul className="mt-4 divide-y divide-line text-sm">
              {products.map((product) => (
                <li key={product.id} className="flex justify-between py-2">
                  <span className="truncate pr-4">{product.title}</span>
                  <span className="shrink-0 text-muted">{formatPrice(product.shippingFee)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <form
          action={saveShippingZone}
          className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5"
        >
          <h2 className="font-display text-lg">Add a zone</h2>
          <Field label="Zone name">
            <Input name="name" required placeholder="South India" />
          </Field>
          <Field label="Surcharge (₹)">
            <Input name="fee" type="number" min={0} defaultValue={0} />
          </Field>
          <Field label="States" hint="One per line.">
            <Textarea name="states" placeholder={"Kerala\nKarnataka"} />
          </Field>
          <Field label="Sort order">
            <Input name="sortOrder" type="number" defaultValue={0} />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="isDefault" />
            Use for any state not listed
          </label>
          <Button type="submit" className="w-full">
            Create zone
          </Button>
        </form>
      </div>
    </div>
  );
}
