import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdmin, requireModerator } from "@/application/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireModerator("/admin");
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <AdminNav isAdmin={isAdmin(user)} />
      {children}
    </div>
  );
}
