"use client";

import { UiIcon } from "@/components/atoms/icons/ui-icon";
import { IconButton } from "@/components/atoms/icon-button";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  doctorInputSchema,
  type DoctorInput,
  type DoctorListQuery,
} from "@doctor-tracker/contracts";
import { Button } from "@/components/atoms/button";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { ApiError } from "@/lib/api";
import {
  useCreateDoctorMutation,
  useDoctorFiltersQuery,
  useDoctorsQuery,
} from "@/lib/queries/doctors";

const emptyDoctor: DoctorInput = {
  name: "",
  specialization: "",
  hospital: "",
  phone: "",
  email: "",
};

function readParams(search: URLSearchParams): Partial<DoctorListQuery> {
  const page = Number(search.get("page") ?? "1");
  const pageSize = Number(search.get("pageSize") ?? "10");
  return {
    q: search.get("q") || undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 20, 50].includes(pageSize) ? pageSize : 10,
    sort: (search.get("sort") || "createdAt.desc") as DoctorListQuery["sort"],
    from: search.get("from") || undefined,
    to: search.get("to") || undefined,
    specialization: search.getAll("specialization"),
    hospital: search.getAll("hospital"),
  };
}

export function DoctorsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(
    () => readParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const doctors = useDoctorsQuery(params);
  const filters = useDoctorFiltersQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const columns = [
    {
      key: "doctor",
      label: "Doctor",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) => (
        <>
          <Link className="table-primary-link" href={`/doctors/${doctor._id}`}>
            {doctor.name}
          </Link>
          <small>{doctor.email}</small>
        </>
      ),
    },
    {
      key: "specialization",
      label: "Specialization",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) => doctor.specialization,
    },
    {
      key: "hospital",
      label: "Hospital",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) => doctor.hospital,
    },
    {
      key: "phone",
      label: "Contact",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) => doctor.phone,
    },
    {
      key: "patients",
      label: "Patients",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) => (
        <span className="tabular">{doctor.patientCount}</span>
      ),
    },
    {
      key: "added",
      label: "Added",
      render: (doctor: NonNullable<typeof doctors.data>["data"][number]) =>
        new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          new Date(doctor.createdAt),
        ),
    },
  ];

  function updateParam(key: string, value: string | string[]) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    (Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .forEach((item) => next.append(key, item));
    if (key !== "page") next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <section className="page-content" aria-labelledby="page-title">
      <div className="page-heading">
        <div>
          <h1 id="page-title">Doctors</h1>
          <p className="page-description">Search your directory and keep patient care organized.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UiIcon name="plus" />
          Add doctor
        </Button>
      </div>
      <div className="filter-toolbar">
        <label className="search-control">
          <span className="sr-only">Search doctors</span>
          <UiIcon name="search" />
          <TextInput
            value={params.q ?? ""}
            placeholder="Search name, email, hospital or phone"
            onChange={(event) => updateParam("q", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>Specialization</span>
          <select
            multiple
            value={params.specialization ?? []}
            onChange={(event) =>
              updateParam(
                "specialization",
                Array.from(event.currentTarget.selectedOptions, (option) => option.value),
              )
            }
          >
            {(filters.data?.specializations ?? []).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Hospital</span>
          <select
            multiple
            value={params.hospital ?? []}
            onChange={(event) =>
              updateParam(
                "hospital",
                Array.from(event.currentTarget.selectedOptions, (option) => option.value),
              )
            }
          >
            {(filters.data?.hospitals ?? []).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Added from</span>
          <TextInput
            type="date"
            value={params.from ?? ""}
            onChange={(event) => updateParam("from", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>To</span>
          <TextInput
            type="date"
            value={params.to ?? ""}
            onChange={(event) => updateParam("to", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>Sort</span>
          <select
            value={params.sort ?? "createdAt.desc"}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            <option value="createdAt.desc">Recently added</option>
            <option value="name.asc">Name A–Z</option>
            <option value="name.desc">Name Z–A</option>
            <option value="patients.desc">Most patients</option>
            <option value="patients.asc">Fewest patients</option>
          </select>
        </label>
      </div>
      {doctors.isError ? (
        <div className="setup-card" role="alert">
          <p>Couldn’t load doctors. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => void doctors.refetch()}>
            <UiIcon name="retry" />
            Retry
          </Button>
        </div>
      ) : null}
      <div className="data-card">
        {doctors.isPending ? (
          <p className="table-message" role="status">
            Loading doctors…
          </p>
        ) : doctors.data?.data.length ? (
          <DataTable
            columns={columns}
            rows={doctors.data.data}
            rowKey={(doctor) => doctor._id}
            label="Doctors"
          />
        ) : (
          <div className="table-message">
            <strong>
              {params.q || params.specialization?.length || params.hospital?.length
                ? "No doctors match your filters."
                : "No doctors yet."}
            </strong>
            <p>Add your first doctor to start tracking patients.</p>
          </div>
        )}
        <div className="table-footer">
          <span>{doctors.data?.meta.total ?? 0} doctors</span>
          <div>
            <label>
              Rows{" "}
              <select
                value={params.pageSize ?? 10}
                onChange={(event) => updateParam("pageSize", event.target.value)}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </label>
            <IconButton
              variant="outline"
              icon="previous"
              label="Previous page"
              disabled={(params.page ?? 1) <= 1}
              onClick={() => updateParam("page", String((params.page ?? 1) - 1))}
            />
            <span>
              Page {params.page ?? 1} of {Math.max(1, doctors.data?.meta.pageCount ?? 1)}
            </span>
            <IconButton
              variant="outline"
              icon="next"
              label="Next page"
              disabled={(params.page ?? 1) >= (doctors.data?.meta.pageCount ?? 1)}
              onClick={() => updateParam("page", String((params.page ?? 1) + 1))}
            />
          </div>
        </div>
      </div>
      {dialogOpen ? <DoctorDialog onClose={() => setDialogOpen(false)} /> : null}
    </section>
  );
}

function DoctorDialog({ onClose }: { onClose: () => void }) {
  const mutation = useCreateDoctorMutation();
  const [values, setValues] = useState<DoctorInput>(emptyDoctor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const parsed = doctorInputSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else setMessage(error instanceof Error ? error.message : "Couldn’t save the doctor.");
    }
  }

  const fields: Array<[keyof DoctorInput, string, string]> = [
    ["name", "Full name", "Dr. Amina Rahman"],
    ["specialization", "Specialization", "Cardiology"],
    ["hospital", "Hospital", "Central Hospital"],
    ["phone", "Phone (11 digits)", "01700000000"],
    ["email", "Email", "doctor@example.com"],
  ];
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <h2 id="doctor-dialog-title">Add doctor</h2>
          </div>
          <IconButton icon="close" label="Close dialog" onClick={onClose} />
        </div>
        <form className="record-form" onSubmit={submit} noValidate>
          {fields.map(([name, label, placeholder]) => (
            <FormField key={name} label={label} htmlFor={`doctor-${name}`} error={errors[name]}>
              <TextInput
                id={`doctor-${name}`}
                name={name}
                type={name === "email" ? "email" : "text"}
                inputMode={name === "phone" ? "numeric" : undefined}
                maxLength={
                  name === "name"
                    ? 120
                    : name === "specialization"
                      ? 100
                      : name === "hospital"
                        ? 160
                        : name === "phone"
                          ? 11
                          : 254
                }
                autoComplete={name === "email" ? "email" : undefined}
                placeholder={placeholder}
                value={values[name] ?? ""}
                aria-invalid={Boolean(errors[name])}
                onChange={(event) => {
                  const value =
                    name === "phone"
                      ? event.target.value.replace(/\D/g, "").slice(0, 11)
                      : event.target.value;
                  setValues((current) => ({ ...current, [name]: value }));
                }}
              />
            </FormField>
          ))}
          {message ? (
            <p className="login-error" role="alert">
              {message}
            </p>
          ) : null}
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save doctor"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
