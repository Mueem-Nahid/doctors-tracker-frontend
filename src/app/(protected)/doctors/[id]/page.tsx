import { DoctorDetail } from "@/components/organisms/doctors/doctor-detail";

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDetail doctorId={id} />;
}
