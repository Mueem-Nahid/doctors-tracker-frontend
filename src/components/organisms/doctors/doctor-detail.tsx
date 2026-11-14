"use client";

import { UiIcon } from "@/components/atoms/icons/ui-icon";
import Link from "next/link";
import { useDoctorQuery } from "@/lib/queries/doctors";
import { DoctorPatientsPanel } from "@/components/organisms/doctors/doctor-patients-panel";

export function DoctorDetail({ doctorId }: { doctorId: string }) {
  const doctor = useDoctorQuery(doctorId);
  if (doctor.isPending)
    return (
      <section className="page-content" role="status">
        Loading doctor…
      </section>
    );
  if (doctor.isError || !doctor.data)
    return (
      <section className="page-content" role="alert">
        <Link className="back-link" href="/doctors">
          <UiIcon name="back" /> Back to doctors
        </Link>
        <p>Couldn’t load this doctor. Check your connection and try again.</p>
      </section>
    );
  const item = doctor.data;
  return (
    <section className="page-content" aria-labelledby="page-title">
      <Link className="back-link" href="/doctors">
        <UiIcon name="back" /> Doctors
      </Link>
      <div className="doctor-profile-card">
        <div className="doctor-profile-avatar" aria-hidden="true">
          {item.name
            .split(/\s+/)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="doctor-profile-main">
          <p className="eyebrow">Doctor profile</p>
          <h1 id="page-title">{item.name}</h1>
          <p className="page-description">
            {item.specialization} · {item.hospital}
          </p>
        </div>
        <div className="doctor-stat">
          <strong>{item.patientCount}</strong>
          <span>Patients</span>
        </div>
      </div>
      <div className="doctor-contact-grid">
        <div>
          <span>
            <UiIcon name="email" /> Email
          </span>
          <a href={`mailto:${item.email}`}>{item.email}</a>
        </div>
        <div>
          <span>
            <UiIcon name="phone" /> Phone
          </span>
          <a href={`tel:${item.phone}`}>{item.phone}</a>
        </div>
        <div>
          <span>
            <UiIcon name="calendar" /> Added
          </span>
          <strong>
            {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
              new Date(item.createdAt),
            )}
          </strong>
        </div>
      </div>
      <DoctorPatientsPanel doctorId={doctorId} />
    </section>
  );
}
