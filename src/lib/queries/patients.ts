import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Page, PatientDetail, PatientInput, PatientListQuery, PatientRow } from "@doctor-tracker/contracts";
import { apiFetch } from "@/lib/api";
import { qk } from "@/lib/queries/keys";

function toSearch(params: Partial<PatientListQuery>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
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

export function useCreatePatientMutation(doctorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => apiFetch<PatientDetail>(`/doctors/${doctorId}/patients`, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.patients.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.all }),
      queryClient.invalidateQueries({ queryKey: qk.doctors.detail(doctorId) }),
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
    ]),
  });
}
