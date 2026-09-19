import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { AddressBook, type SavedAddress } from "@/components/site/address-book";
import { noIndex } from "@/lib/seo";

export const metadata: Metadata = { title: "Saved addresses", ...noIndex };

export default async function AddressesPage() {
  const session = await auth();

  const [addresses, zones] = await Promise.all([
    safeQuery(
      () =>
        prisma.address.findMany({
          where: { userId: session!.user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        }),
      [],
    ),
    safeQuery(() => prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } }), []),
  ]);

  const saved: SavedAddress[] = addresses.map((address) => ({
    id: address.id,
    reference: address.reference,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? "",
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  }));

  return (
    <div>
      <p className="mb-6 text-sm text-muted">
        Each address carries a short ID. Quote it to us when you are sending a gift to someone else
        and we will know exactly where the parcel goes.
      </p>
      <AddressBook addresses={saved} states={zones.flatMap((zone) => zone.states)} />
    </div>
  );
}
