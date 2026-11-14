import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";
import { Suspense } from "react";
import { DoctorsTable } from "@/components/organisms/doctors/doctors-table";

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <LoadingPlaceholder label="Loading doctors" variant="page" />
        </div>
      }
    >
      <DoctorsTable />
    </Suspense>
  );
}
