import { Suspense } from "react";
import { DoctorsTable } from "@/components/organisms/doctors/doctors-table";

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <section className="page-content route-loading" role="status">
          Loading doctors…
        </section>
      }
    >
      <DoctorsTable />
    </Suspense>
  );
}
