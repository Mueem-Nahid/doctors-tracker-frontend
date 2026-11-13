import { Suspense } from "react";
import { PatientsTable } from "@/components/organisms/patients/patients-table";

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <section className="page-content route-loading" role="status">
          Loading patients…
        </section>
      }
    >
      <PatientsTable />
    </Suspense>
  );
}
