import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GlobalPatientInput, GlobalPatientListQuery, Page, PatientDetail, PatientInput, PatientListQuery, PatientPatch, PatientRow } from "@doctor-tracker/contracts";
import { apiFetch } from "@/lib/api";
import { qk } from "@/lib/queries/keys";

function toSearch(params: Partial<PatientListQuery> | Partial<GlobalPatientListQuery>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return;
    search.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  return search.toString();
}

export function useDoctorPatientsQuery(id: string, params: Partial<PatientListQuery>) {
  return useQuery({
    queryKey: qk.patients.byDoctor(id, params),
    queryFn: ({ signal }) => apiFetch<Page<PatientRow>>(`/doctors/${id}/patients?${toSearch(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function usePatientsQuery(params: Partial<GlobalPatientListQuery>) {
  return useQuery({
    queryKey: qk.patients.list(params),
    queryFn: ({ signal }) => apiFetch<Page<PatientRow>>(`/patients?${toSearch(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function usePatientQuery(id: string, enabled = true) {
  return useQuery({ queryKey: qk.patients.detail(id), queryFn: ({ signal }) => apiFetch<PatientDetail>(`/patients/${id}`, { signal }), enabled });
}

const invalidatePatientViews = (queryClient: ReturnType<typeof useQueryClient>) => Promise.all([
  queryClient.invalidateQueries({ queryKey: qk.patients.all }),
  queryClient.invalidateQueries({ queryKey: qk.doctors.all }),
  queryClient.invalidateQueries({ queryKey: qk.dashboard.all }),
]);

export function useCreateGlobalPatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GlobalPatientInput) => apiFetch<PatientDetail>("/patients", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidatePatientViews(queryClient),
  });
}

export function useUpdatePatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PatientPatch }) => apiFetch<PatientDetail>(`/patients/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: async (_data, variables) => {
      await Promise.all([invalidatePatientViews(queryClient), queryClient.invalidateQueries({ queryKey: qk.patients.detail(variables.id) })]);
    },
  });
}

export function useDeleteGlobalPatientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/patients/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidatePatientViews(queryClient),
  });
}

export function useCreatePatientMutation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => apiFetch<PatientDetail>(`/doctors/${doctorId}/patients`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.patients.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.detail(doctorId) }),
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all }),
    ]),
  });
}

export function useDeletePatientMutation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patientId: string) => apiFetch<void>(`/doctors/${doctorId}/patients/${patientId}`, { method: "DELETE" }),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.patients.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.detail(doctorId) }),
      queryClient.invalidateQueries({ queryKey: qk.dashboard.all }),
    ]),
  });
}
