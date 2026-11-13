import type { DoctorListQuery, GlobalPatientListQuery, PatientListQuery, ReportingRange } from "@doctor-tracker/contracts";

export const qk = {
  doctors: {
    all: ["doctors"] as const,
    list: (params: Partial<DoctorListQuery>) => ["doctors", "list", params] as const,
    detail: (id: string) => ["doctors", "detail", id] as const,
  },
  patients: {
    all: ["patients"] as const,
    list: (params: Partial<GlobalPatientListQuery>) => ["patients", "list", params] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
    byDoctor: (id: string, params: Partial<PatientListQuery>) => ["patients", "doctor", id, params] as const,
  },
  dashboard: { all: ["dashboard"] as const, summary: (range: ReportingRange) => ["dashboard", "summary", range] as const },
  meta: { filters: ["meta", "filters"] as const },
};
