import { Suspense } from "react";
import { DoctorDetail } from "@/components/organisms/doctors/doctor-detail";

export default function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <section className="page-content route-loading" role="status">
          Loading doctor…
        </section>
      }
    >
      <DoctorPageContent params={params} />
    </Suspense>
  );
}

async function DoctorPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDetail doctorId={id} />;
}
