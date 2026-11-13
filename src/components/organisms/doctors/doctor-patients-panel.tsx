"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  patientConditionSchema,
  patientInputSchema,
  patientStatusSchema,
  type PatientInput,
  type PatientListQuery,
} from "@doctor-tracker/contracts";
import { Button } from "@/components/atoms/button";
import { TextInput } from "@/components/atoms/text-input";
import { FormField } from "@/components/molecules/form-field";
import { DataTable } from "@/components/organisms/data-table/data-table";
import { ApiError } from "@/lib/api";
import {
  useCreatePatientMutation,
  useDeletePatientMutation,
  useDoctorPatientsQuery,
} from "@/lib/queries/patients";

type PatientDraft = Omit<PatientInput, "age"> & { age: string };
const newPatient: PatientDraft = {
  name: "",
  age: "",
  gender: "female",
  phone: "",
  email: "",
  condition: "Other",
  status: "Active",
  notes: "",
};

function getQuery(search: URLSearchParams): Partial<PatientListQuery> {
  const page = Number(search.get("patientPage") ?? "1");
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: 10,
    q: search.get("patientQ") || undefined,
    sort: "createdAt.desc",
    condition: search.get("condition")
      ? (search.get("condition")!.split(",") as PatientListQuery["condition"])
      : [],
    status: search.get("status")
      ? (search.get("status")!.split(",") as PatientListQuery["status"])
      : [],
  };
}

export function DoctorPatientsPanel({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(
    () => getQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const result = useDoctorPatientsQuery(doctorId, params);
  const [dialogOpen, setDialogOpen] = useState(false);
  const remove = useDeletePatientMutation(doctorId);
  const columns = [
    {
      key: "patient",
      label: "Patient",
      render: (patient: NonNullable<typeof result.data>["data"][number]) => (
        <>
          <strong>{patient.name}</strong>
          <small>{patient.email ?? "No email"}</small>
        </>
      ),
    },
    {
      key: "age",
      label: "Age / gender",
      render: (patient: NonNullable<typeof result.data>["data"][number]) =>
        `${patient.age} · ${patient.gender}`,
    },
    {
      key: "condition",
      label: "Condition",
      render: (patient: NonNullable<typeof result.data>["data"][number]) => patient.condition,
    },
    {
      key: "status",
      label: "Status",
      render: (patient: NonNullable<typeof result.data>["data"][number]) => (
        <span className={`status-chip status-${patient.status.toLowerCase().replaceAll(" ", "-")}`}>
          {patient.status}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (patient: NonNullable<typeof result.data>["data"][number]) => patient.phone,
    },
    {
      key: "added",
      label: "Added",
      render: (patient: NonNullable<typeof result.data>["data"][number]) =>
        new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
          new Date(patient.createdAt),
        ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Actions</span>,
      render: (patient: NonNullable<typeof result.data>["data"][number]) => (
        <Button
          variant="ghost"
          disabled={remove.isPending}
          aria-label={`Delete ${patient.name}`}
          onClick={() => void deletePatient(patient._id, patient.name)}
        >
          Delete
        </Button>
      ),
    },
  ];
  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "patientPage") next.delete("patientPage");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  async function deletePatient(id: string, name: string) {
    if (
      window.confirm(
        `Delete ${name}? This permanently removes the patient record and can’t be undone.`,
      )
    ) {
      await remove
        .mutateAsync(id)
        .catch((error: unknown) =>
          window.alert(error instanceof Error ? error.message : "Couldn’t delete the patient."),
        );
    }
  }
  return (
    <section className="patients-section" aria-labelledby="patients-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Care team</p>
          <h2 id="patients-title">Patients</h2>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add patient</Button>
      </div>
      <div className="filter-toolbar compact-toolbar">
        <label className="search-control">
          <span className="sr-only">Search patients</span>
          <TextInput
            placeholder="Search patients"
            value={params.q ?? ""}
            onChange={(event) => update("patientQ", event.target.value)}
          />
        </label>
        <label className="filter-control">
          <span>Condition</span>
          <select
            value={params.condition?.[0] ?? ""}
            onChange={(event) => update("condition", event.target.value)}
          >
            <option value="">All conditions</option>
            {patientConditionSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Status</span>
          <select
            value={params.status?.[0] ?? ""}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {patientStatusSchema.options.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="data-card">
        {result.isError ? (
          <div className="table-message" role="alert">
            Couldn’t load patients.{" "}
            <Button variant="outline" onClick={() => void result.refetch()}>
              Retry
            </Button>
          </div>
        ) : result.isPending ? (
          <p className="table-message" role="status">
            Loading patients…
          </p>
        ) : result.data?.data.length ? (
          <DataTable
            columns={columns}
            rows={result.data.data}
            rowKey={(patient) => patient._id}
            label="Patients assigned to this doctor"
          />
        ) : (
          <div className="table-message">
            <strong>
              {params.q || params.condition?.length || params.status?.length
                ? "No patients match these filters."
                : "No patients added yet."}
            </strong>
            <p>Add a patient to this doctor’s panel.</p>
          </div>
        )}
        <div className="table-footer">
          <span>{result.data?.meta.total ?? 0} patients</span>
          <div>
            <Button
              variant="outline"
              disabled={(params.page ?? 1) <= 1}
              onClick={() => update("patientPage", String((params.page ?? 1) - 1))}
            >
              Previous
            </Button>
            <span>
              Page {params.page ?? 1} of {Math.max(1, result.data?.meta.pageCount ?? 1)}
            </span>
            <Button
              variant="outline"
              disabled={(params.page ?? 1) >= (result.data?.meta.pageCount ?? 1)}
              onClick={() => update("patientPage", String((params.page ?? 1) + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {dialogOpen ? (
        <PatientDialog doctorId={doctorId} onClose={() => setDialogOpen(false)} />
      ) : null}
    </section>
  );
}

function PatientDialog({ doctorId, onClose }: { doctorId: string; onClose: () => void }) {
  const mutation = useCreatePatientMutation(doctorId);
  const [values, setValues] = useState<PatientDraft>(newPatient);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const parsed = patientInputSchema.safeParse({ ...values, age: values.age });
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
      else setMessage(error instanceof Error ? error.message : "Couldn’t save the patient.");
    }
  }
  const textField = (key: "name" | "age" | "phone" | "email", label: string, type = "text") => (
    <FormField key={key} label={label} htmlFor={`patient-${key}`} error={errors[key]}>
      <TextInput
        id={`patient-${key}`}
        type={type}
        value={values[key]}
        aria-invalid={Boolean(errors[key])}
        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
      />
    </FormField>
  );
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
        aria-labelledby="patient-dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Patient record</p>
            <h2 id="patient-dialog-title">Add patient</h2>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            ×
          </Button>
        </div>
        <form className="record-form" onSubmit={submit} noValidate>
          {textField("name", "Full name")}
          {textField("age", "Age", "number")}
          <FormField label="Gender" htmlFor="patient-gender" error={errors.gender}>
            <select
              id="patient-gender"
              value={values.gender}
              onChange={(event) =>
                setValues((v) => ({ ...v, gender: event.target.value as PatientDraft["gender"] }))
              }
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          {textField("phone", "Phone")}
          {textField("email", "Email", "email")}
          <FormField label="Condition" htmlFor="patient-condition" error={errors.condition}>
            <select
              id="patient-condition"
              value={values.condition}
              onChange={(event) =>
                setValues((v) => ({
                  ...v,
                  condition: event.target.value as PatientDraft["condition"],
                }))
              }
            >
              {patientConditionSchema.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status" htmlFor="patient-status" error={errors.status}>
            <select
              id="patient-status"
              value={values.status}
              onChange={(event) =>
                setValues((v) => ({ ...v, status: event.target.value as PatientDraft["status"] }))
              }
            >
              {patientStatusSchema.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" htmlFor="patient-notes" error={errors.notes}>
            <textarea
              id="patient-notes"
              maxLength={500}
              value={values.notes ?? ""}
              onChange={(event) => setValues((v) => ({ ...v, notes: event.target.value }))}
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
            <Button disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save patient"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
