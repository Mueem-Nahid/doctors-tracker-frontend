import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";
import { Suspense } from "react";
import { PatientsTable } from "@/components/organisms/patients/patients-table";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <LoadingPlaceholder label="Loading patients" variant="page" />
        </div>
      }
    >
      <PatientsTable />
    </Suspense>
  );
}
