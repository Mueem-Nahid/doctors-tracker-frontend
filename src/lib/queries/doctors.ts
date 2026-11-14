import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Doctor, DoctorInput, DoctorListQuery, Page } from "@doctor-tracker/contracts";
import { apiFetch } from "@/lib/api";
import { qk } from "@/lib/queries/keys";

function toSearch(params: Partial<DoctorListQuery>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)));
    else search.set(key, String(value));
  });
  return search.toString();
}

export type FilterOptions = { specializations: string[]; hospitals: string[] };

export function useDoctorsQuery(params: Partial<DoctorListQuery>) {
  return useQuery({
    queryKey: qk.doctors.list(params),
    queryFn: ({ signal }) => apiFetch<Page<Doctor>>(`/doctors?${toSearch(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useDoctorQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: qk.doctors.detail(id),
    queryFn: ({ signal }) => apiFetch<Doctor>(`/doctors/${id}`, { signal }),
    enabled,
  });
}

export function useDoctorFiltersQuery() {
  return useQuery({
    queryKey: qk.meta.filters,
    queryFn: ({ signal }) => apiFetch<FilterOptions>("/meta/filters", { signal }),
  });
}

export function useCreateDoctorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DoctorInput) =>
      apiFetch<Doctor>("/doctors", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.doctors.all }),
        queryClient.invalidateQueries({ queryKey: qk.meta.filters }),
        queryClient.invalidateQueries({ queryKey: qk.dashboard.all }),
      ]),
  });
}
