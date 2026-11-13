"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  globalPatientInputSchema,
  patientConditionSchema,
  patientInputSchema,
  patientStatusSchema,
  type PatientDetail,
  type PatientInput,
  type PatientPatch,
  type PatientRow,
} from "@doctor-tracker/contracts";
import { Button } from "@/components/atoms/button";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { ApiError } from "@/lib/api";
import { useDoctorsQuery } from "@/lib/queries/doctors";
import {
  useCreateGlobalPatientMutation,
  useDeleteGlobalPatientMutation,
  usePatientQuery,
  usePatientsQuery,
  useUpdatePatientMutation,
} from "@/lib/queries/patients";

type Params = Partial<import("@doctor-tracker/contracts").GlobalPatientListQuery>;
type Draft = {
  doctorId: string;
  name: string;
  age: string;
  gender: PatientInput["gender"];
  phone: string;
  email: string;
  condition: PatientInput["condition"];
  status: PatientInput["status"];
  notes: string;
};
const emptyDraft: Draft = {
  doctorId: "",
  name: "",
  age: "",
  gender: "female",
  phone: "",
  email: "",
  condition: "Other",
  status: "Active",
  notes: "",
};

function readParams(search: URLSearchParams): Params {
  const page = Number(search.get("page") ?? 1),
    pageSize = Number(search.get("pageSize") ?? 10);
  return {
    q: search.get("q") || undefined,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: [10, 20, 50].includes(pageSize) ? pageSize : 10,
    sort: (search.get("sort") || "createdAt.desc") as Params["sort"],
    from: search.get("from") || undefined,
    to: search.get("to") || undefined,
    condition: search.getAll("condition"),
    status: search.getAll("status"),
    doctorId: search.getAll("doctorId"),
  };
}

export function PatientsTable() {
  const router = useRouter(),
    pathname = usePathname(),
    searchParams = useSearchParams();
  const params = useMemo(
    () => readParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const patients = usePatientsQuery(params);
  const [open, setOpen] = useState(false),
    [editingId, setEditingId] = useState<string>();
  const remove = useDeleteGlobalPatientMutation();

  const update = useCallback(
    (key: string, value: string | string[]) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(key);
      (Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .forEach((item) => next.append(key, item));
      if (key !== "page") next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );
  async function deletePatient(patient: PatientRow) {
    if (
      !window.confirm(
        `Delete ${patient.name}? This permanently removes the patient record and can’t be undone.`,
      )
    )
      return;
    try {
      await remove.mutateAsync(patient._id);
      const currentPage = params.page ?? 1;
      if ((patients.data?.data.length ?? 0) === 1 && currentPage > 1)
        update("page", String(currentPage - 1));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Couldn’t delete the patient.");
    }
  }
  const columns = [
    {
      key: "patient",
      label: "Patient",
      render: (patient: PatientRow) => (
        <>
          <strong>{patient.name}</strong>
          <small>{patient.email ?? "No email"}</small>
        </>
      ),
    },
    {
      key: "doctor",
      label: "Doctor",
      render: (patient: PatientRow) => (
        <Link className="table-primary-link" href={`/doctors/${patient.doctorId}`}>
          {patient.doctorName}
        </Link>
      ),
    },
    {
      key: "age",
      label: "Age / gender",
      render: (patient: PatientRow) => `${patient.age} · ${patient.gender}`,
    },
    { key: "condition", label: "Condition", render: (patient: PatientRow) => patient.condition },
    {
      key: "status",
      label: "Status",
      render: (patient: PatientRow) => (
        <span className={`status-chip status-${patient.status.toLowerCase().replaceAll(" ", "-")}`}>
          {patient.status}
        </span>
      ),
    },
    { key: "phone", label: "Phone", render: (patient: PatientRow) => patient.phone },
    {
      key: "added",
      label: "Added",
      render: (patient: PatientRow) =>
        new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          new Date(patient.createdAt),
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (patient: PatientRow) => (
        <div className="row-actions">
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(patient._id);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            disabled={remove.isPending}
            aria-label={`Delete ${patient.name}`}
            onClick={() => void deletePatient(patient)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
  const hasFilters = Boolean(
    params.q ||
    params.condition?.length ||
    params.status?.length ||
    params.doctorId?.length ||
    params.from ||
    params.to,
  );
  return (
    <section className="page-content" aria-labelledby="page-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Care directory</p>
          <h1 id="page-title">Patients</h1>
          <p className="page-description">
            Find patient records, update care details, and manage doctor assignments.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(undefined);
            setOpen(true);
          }}
        >
          Add patient
        </Button>
      </div>
      <div className="filter-toolbar">
        <PatientSearch
          key={params.q ?? ""}
          value={params.q ?? ""}
          onCommit={(value) => update("q", value)}
        />
        <label className="filter-control">
          <span>Condition</span>
          <select
            multiple
            value={params.condition ?? []}
            onChange={(event) =>
              update(
                "condition",
                Array.from(event.currentTarget.selectedOptions, (option) => option.value),
              )
            }
          >
            {patientConditionSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Status</span>
          <select
            multiple
            value={params.status ?? []}
            onChange={(event) =>
              update(
                "status",
                Array.from(event.currentTarget.selectedOptions, (option) => option.value),
              )
            }
          >
            {patientStatusSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <DoctorFacet
          selected={params.doctorId ?? []}
          onChange={(value) => update("doctorId", value)}
        />
        <label className="filter-control">
          <span>Added from</span>
          <TextInput
            type="date"
            value={params.from ?? ""}
            onChange={(event) => update("from", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>To</span>
          <TextInput
            type="date"
            value={params.to ?? ""}
            onChange={(event) => update("to", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>Sort</span>
          <select
            value={params.sort ?? "createdAt.desc"}
            onChange={(event) => update("sort", event.target.value)}
          >
            <option value="createdAt.desc">Recently added</option>
            <option value="name.asc">Name A–Z</option>
            <option value="name.desc">Name Z–A</option>
            <option value="age.asc">Age low to high</option>
            <option value="age.desc">Age high to low</option>
          </select>
        </label>
        {hasFilters ? (
          <Button variant="outline" onClick={() => router.replace(pathname, { scroll: false })}>
            Clear filters
          </Button>
        ) : null}
      </div>
      {patients.isError ? (
        <div className="setup-card" role="alert">
          <p>Couldn’t load patients. Check your connection and try again.</p>
          <Button variant="outline" onClick={() => void patients.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      <div className="data-card">
        {patients.isPending ? (
          <p className="table-message" role="status">
            Loading patients…
          </p>
        ) : patients.data?.data.length ? (
          <DataTable
            columns={columns}
            rows={patients.data.data}
            rowKey={(patient) => patient._id}
            label="Patients"
          />
        ) : (
          <div className="table-message">
            <strong>{hasFilters ? "No patients match these filters." : "No patients yet."}</strong>
            <p>
              {hasFilters
                ? "Try changing or clearing your filters."
                : "Add a patient to start building the care directory."}
            </p>
          </div>
        )}
        <div className="table-footer">
          <span>{patients.data?.meta.total ?? 0} patients</span>
          <div>
            <label>
              Rows{" "}
              <select
                value={params.pageSize ?? 10}
                onChange={(event) => update("pageSize", event.target.value)}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </label>
            <Button
              variant="outline"
              disabled={(params.page ?? 1) <= 1}
              onClick={() => update("page", String((params.page ?? 1) - 1))}
            >
              Previous
            </Button>
            <span>
              Page {params.page ?? 1} of {Math.max(1, patients.data?.meta.pageCount ?? 1)}
            </span>
            <Button
              variant="outline"
              disabled={(params.page ?? 1) >= (patients.data?.meta.pageCount ?? 1)}
              onClick={() => update("page", String((params.page ?? 1) + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {open ? <PatientSheet patientId={editingId} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

function PatientSearch({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const [searchText, setSearchText] = useState(value);
  useEffect(() => {
    if (searchText === value) return;
    const timer = window.setTimeout(() => onCommit(searchText), 300);
    return () => window.clearTimeout(timer);
  }, [onCommit, searchText, value]);
  return (
    <label className="search-control">
      <span className="sr-only">Search patients</span>
      <TextInput
        value={searchText}
        placeholder="Search name, email or phone"
        onChange={(event) => setSearchText(event.target.value)}
      />
    </label>
  );
}

function DoctorFacet({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const doctors = useDoctorsQuery({
    q: search || undefined,
    page: 1,
    pageSize: 50,
    sort: "name.asc",
  });
  return (
    <label className="filter-control">
      <span>Doctor</span>
      <select
        multiple
        value={selected}
        onChange={(event) =>
          onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))
        }
      >
        {(doctors.data?.data ?? []).map((doctor) => (
          <option key={doctor._id} value={doctor._id}>
            {doctor.name}
          </option>
        ))}
      </select>
      <TextInput
        aria-label="Search doctors"
        placeholder="Find doctor"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </label>
  );
}

function PatientSheet({ patientId, onClose }: { patientId?: string; onClose: () => void }) {
  const detail = usePatientQuery(patientId ?? "", Boolean(patientId));
  if (patientId && detail.isPending)
    return (
      <SheetFrame patientId={patientId} onClose={onClose}>
        <p className="table-message" role="status">
          Loading patient details…
        </p>
      </SheetFrame>
    );
  if (patientId && detail.isError)
    return (
      <SheetFrame patientId={patientId} onClose={onClose}>
        <div className="table-message" role="alert">
          Couldn’t load this patient.{" "}
          <Button variant="outline" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        </div>
      </SheetFrame>
    );
  return (
    <PatientForm
      key={patientId ?? "new"}
      patientId={patientId}
      initialPatient={detail.data}
      onClose={onClose}
    />
  );
}

function SheetFrame({
  patientId,
  onClose,
  children,
}: {
  patientId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="form-dialog patient-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-sheet-title"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Patient record</p>
            <h2 id="patient-sheet-title">{patientId ? "Edit patient" : "Add patient"}</h2>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close sheet">
            ×
          </Button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PatientForm({
  patientId,
  initialPatient,
  onClose,
}: {
  patientId?: string;
  initialPatient?: PatientDetail;
  onClose: () => void;
}) {
  const create = useCreateGlobalPatientMutation(),
    update = useUpdatePatientMutation();
  const [draft, setDraft] = useState<Draft>(() =>
      initialPatient ? fromPatient(initialPatient) : emptyDraft,
    ),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(""),
    [doctorSearch, setDoctorSearch] = useState("");
  const doctors = useDoctorsQuery({
    q: doctorSearch || undefined,
    page: 1,
    pageSize: 50,
    sort: "name.asc",
  });
  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const { doctorId, ...fields } = draft;
    const parsed = patientInputSchema.safeParse({ ...fields, age: fields.age });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    if (!doctorId) {
      setErrors({ doctorId: "Select a doctor" });
      return;
    }
    try {
      if (!patientId) {
        const input = globalPatientInputSchema.parse({
          ...parsed.data,
          email: parsed.data.email || undefined,
          notes: parsed.data.notes || undefined,
          doctorId,
        });
        await create.mutateAsync(input);
      } else if (initialPatient) {
        const patch = changedFields(initialPatient, parsed.data, doctorId);
        if (Object.keys(patch).length) await update.mutateAsync({ id: patientId, patch });
      }
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else setMessage(error instanceof Error ? error.message : "Couldn’t save the patient.");
    }
  }
  const field = (key: "name" | "age" | "phone" | "email", label: string, type = "text") => (
    <FormField key={key} label={label} htmlFor={`global-patient-${key}`} error={errors[key]}>
      <TextInput
        id={`global-patient-${key}`}
        type={type}
        inputMode={key === "phone" ? "numeric" : key === "age" ? "numeric" : undefined}
        maxLength={key === "name" ? 120 : key === "phone" ? 11 : key === "email" ? 254 : 3}
        min={key === "age" ? 0 : undefined}
        max={key === "age" ? 120 : undefined}
        value={draft[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(event) =>
          set(
            key,
            (key === "phone"
              ? event.target.value.replace(/\D/g, "").slice(0, 11)
              : event.target.value) as Draft[typeof key],
          )
        }
      />
    </FormField>
  );
  return (
    <SheetFrame patientId={patientId ?? ""} onClose={onClose}>
      <form className="record-form" onSubmit={submit} noValidate>
        <FormField label="Doctor" htmlFor="global-patient-doctor" error={errors.doctorId}>
          <div className="doctor-select-stack">
            <TextInput
              aria-label="Search doctors"
              placeholder="Search doctors"
              value={doctorSearch}
              onChange={(event) => setDoctorSearch(event.target.value)}
            />
            <select
              id="global-patient-doctor"
              value={draft.doctorId}
              aria-invalid={Boolean(errors.doctorId)}
              onChange={(event) => set("doctorId", event.target.value)}
            >
              <option value="">Select doctor</option>
              {draft.doctorId &&
              !doctors.data?.data.some((doctor) => doctor._id === draft.doctorId) &&
              initialPatient ? (
                <option value={initialPatient.doctorId}>{initialPatient.doctorName}</option>
              ) : null}
              {(doctors.data?.data ?? []).map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} · {doctor.hospital}
                </option>
              ))}
            </select>
          </div>
        </FormField>
        {field("name", "Full name")}
        {field("age", "Age", "number")}
        <FormField label="Gender" htmlFor="global-patient-gender" error={errors.gender}>
          <select
            id="global-patient-gender"
            value={draft.gender}
            onChange={(event) => set("gender", event.target.value as Draft["gender"])}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        {field("phone", "Phone (11 digits)")}
        {field("email", "Email", "email")}
        <FormField label="Condition" htmlFor="global-patient-condition" error={errors.condition}>
          <select
            id="global-patient-condition"
            value={draft.condition}
            onChange={(event) => set("condition", event.target.value as Draft["condition"])}
          >
            {patientConditionSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" htmlFor="global-patient-status" error={errors.status}>
          <select
            id="global-patient-status"
            value={draft.status}
            onChange={(event) => set("status", event.target.value as Draft["status"])}
          >
            {patientStatusSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="global-patient-notes" error={errors.notes}>
          <textarea
            id="global-patient-notes"
            maxLength={500}
            value={draft.notes}
            onChange={(event) => set("notes", event.target.value)}
          />
        </FormField>
        {message ? (
          <p className="login-error" role="alert">
            {message}
          </p>
        ) : null}
        <div className="dialog-actions">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending
              ? "Saving…"
              : patientId
                ? "Save changes"
                : "Create patient"}
          </Button>
        </div>
      </form>
    </SheetFrame>
  );
}

function fromPatient(patient: PatientDetail): Draft {
  return {
    doctorId: patient.doctorId,
    name: patient.name,
    age: String(patient.age),
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "",
    condition: patient.condition,
    status: patient.status,
    notes: patient.notes ?? "",
  };
}
function changedFields(
  original: PatientDetail,
  input: PatientInput,
  doctorId: string,
): PatientPatch {
  const next: PatientPatch = {};
  if (doctorId !== original.doctorId) next.doctorId = doctorId;
  if (input.name !== original.name) next.name = input.name;
  if (input.age !== original.age) next.age = input.age;
  if (input.gender !== original.gender) next.gender = input.gender;
  if (input.phone !== original.phone) next.phone = input.phone;
  if ((input.email ?? null) !== (original.email ?? null)) next.email = input.email ?? null;
  if (input.condition !== original.condition) next.condition = input.condition;
  if (input.status !== original.status) next.status = input.status;
  const notes = input.notes?.trim() || null;
  if (notes !== (original.notes ?? null)) next.notes = notes;
  return next;
}
