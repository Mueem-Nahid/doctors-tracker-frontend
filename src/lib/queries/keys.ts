import type { DoctorListQuery, PatientListQuery } from "@doctor-tracker/contracts";

export const qk = {
  doctors: {
    all: ["doctors"] as const,
    list: (params: Partial<DoctorListQuery>) => ["doctors", "list", params] as const,
    detail: (id: string) => ["doctors", "detail", id] as const,
  },
  patients: {
    all: ["patients"] as const,
    byDoctor: (id: string, params: Partial<PatientListQuery>) => ["patients", "doctor", id, params] as const,
  },
  meta: { filters: ["meta", "filters"] as const },
};
