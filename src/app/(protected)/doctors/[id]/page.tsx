import { LoadingPlaceholder } from "@/components/molecules/loading-placeholder";
import { Suspense } from "react";
import { DoctorDetail } from "@/components/organisms/doctors/doctor-detail";

export default function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="page-content">
          <LoadingPlaceholder label="Loading doctor profile" variant="profile" />
        </div>
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
