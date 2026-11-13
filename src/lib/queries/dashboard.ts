import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary, ReportingRange } from "@doctor-tracker/contracts";
import { apiFetch } from "@/lib/api";
import { qk } from "@/lib/queries/keys";

export function useDashboardSummary(range: ReportingRange) {
  return useQuery({
    queryKey: qk.dashboard.summary(range),
    queryFn: ({ signal }) =>
      apiFetch<DashboardSummary>(`/dashboard/summary?range=${range}`, { signal }),
    staleTime: 60_000,
  });
}
