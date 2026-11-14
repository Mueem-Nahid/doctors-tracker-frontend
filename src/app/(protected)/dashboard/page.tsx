import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";
import { Suspense } from "react";
import { Dashboard } from "@/components/organisms/dashboard/dashboard";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <LoadingPlaceholder label="Loading dashboard" variant="page" />
        </div>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
