import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserForm } from "@/components/admin/user-form";

export const dynamic = "force-dynamic";

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div>
        <h1 className="font-display text-3xl">New user</h1>
        <p className="mt-1 text-sm text-muted">
          Mostly for adding a second admin. Customers normally create their own accounts.
        </p>
      </div>

      <div className="max-w-xl rounded-2xl border border-line bg-white p-6">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
