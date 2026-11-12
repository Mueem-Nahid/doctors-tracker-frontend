import type { ReactNode } from "react";
import AppShell from "@/components/app-shell";
import { requireAdmin } from "@/lib/server/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AppShell admin={admin}>{children}</AppShell>;
}
