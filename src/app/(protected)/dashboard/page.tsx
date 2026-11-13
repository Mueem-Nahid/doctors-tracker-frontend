import { Suspense } from "react";
import { Dashboard } from "@/components/organisms/dashboard/dashboard";

export default function DashboardPage() {
  return <Suspense fallback={<section className="page-content route-loading" role="status">Loading dashboard…</section>}><Dashboard /></Suspense>;
}
