"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  reportingRangeSchema,
  type DashboardSummary,
  type ReportingRange,
} from "@doctor-tracker/contracts";
import { Button } from "@/components/atoms/button";
import { useDashboardSummary } from "@/lib/queries/dashboard";

const ranges: Array<{ value: ReportingRange; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];
const numberFormat = new Intl.NumberFormat();
const TrendGraph = dynamic(() => import("./dashboard-charts").then((module) => module.TrendGraph), {
  ssr: false,
  loading: () => (
    <div className="chart-loading" role="status">
      Loading chart…
    </div>
  ),
});
const ConditionDonut = dynamic(
  () => import("./dashboard-charts").then((module) => module.ConditionDonut),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading" role="status">
        Loading chart…
      </div>
    ),
  },
);
const DoctorLoadChart = dynamic(
  () => import("./dashboard-charts").then((module) => module.DoctorLoadChart),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading" role="status">
        Loading chart…
      </div>
    ),
  },
);
const SpecializationChart = dynamic(
  () => import("./dashboard-charts").then((module) => module.SpecializationChart),
  {
    ssr: false,
    loading: () => (
      <div className="chart-loading" role="status">
        Loading chart…
      </div>
    ),
  },
);

export function Dashboard() {
  const router = useRouter(),
    pathname = usePathname(),
    search = useSearchParams();
  const requestedRange = search.get("range");
  const range = reportingRangeSchema.safeParse(requestedRange).success
    ? (requestedRange as ReportingRange)
    : "30d";
  const summary = useDashboardSummary(range);
  const data = summary.data;
  function setRange(value: ReportingRange) {
    const next = new URLSearchParams(search.toString());
    if (value === "30d") next.delete("range");
    else next.set("range", value);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  return (
    <section className="page-content dashboard-content" aria-labelledby="page-title">
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 id="page-title">Dashboard</h1>
          <p className="page-description">Clinic activity and patient workload at a glance.</p>
        </div>
        <label className="range-picker">
          <span>Date range</span>
          <select
            aria-label="Dashboard date range"
            value={range}
            onChange={(event) => setRange(event.target.value as ReportingRange)}
          >
            {ranges.map(({ value, label }) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {summary.isError ? (
        <div className="setup-card" role="alert">
          <div>
            <h2>Couldn’t load dashboard data</h2>
            <p>Check your connection and retry.</p>
          </div>
          <Button variant="outline" onClick={() => void summary.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {summary.isPending ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <KpiGrid data={data} />
          <div className="dashboard-chart-grid">
            <TrendCard points={data.patientsOverTime} range={range} />
            <ConditionCard data={data} />
            <DoctorLoadCard data={data} />
            <SpecializationCard data={data} />
          </div>
          <RecentPatients rows={data.recentPatients} />
        </>
      ) : null}
    </section>
  );
}

function KpiGrid({ data }: { data: DashboardSummary }) {
  const { kpis } = data;
  const change = kpis.newPatients.deltaPct;
  return (
    <div className="kpi-grid">
      <Kpi label="Total doctors" value={kpis.totalDoctors} detail="Across the directory" />
      <Kpi label="Total patients" value={kpis.totalPatients} detail="All current patient records" />
      <Kpi
        label="Average patients per doctor"
        value={kpis.avgPatientsPerDoctor.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        detail="Based on all doctors"
      />
      <Kpi
        label="New patients"
        value={kpis.newPatients.value}
        detail={
          change === null
            ? `Previous period: ${numberFormat.format(kpis.newPatients.previous)}`
            : `${change > 0 ? "+" : ""}${change}% vs previous period`
        }
      />
    </div>
  );
}
function Kpi({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <article className="kpi-card">
      <p>{label}</p>
      <strong>{typeof value === "number" ? numberFormat.format(value) : value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
  table,
  className = "",
}: {
  title: string;
  description: string;
  children: ReactNode;
  table: ReactNode;
  className?: string;
}) {
  const [showTable, setShowTable] = useState(false);
  const id = `chart-${title.replaceAll(" ", "-").toLowerCase()}`;
  return (
    <section className={`chart-card ${className}`.trim()} aria-labelledby={id}>
      <header className="chart-card-heading">
        <div>
          <h2 id={id}>{title}</h2>
          <p>{description}</p>
        </div>
        <Button
          variant="ghost"
          className="chart-table-toggle"
          aria-expanded={showTable}
          onClick={() => setShowTable((current) => !current)}
        >
          {showTable ? "View chart" : "View as table"}
        </Button>
      </header>
      {showTable ? <div className="chart-table-wrap">{table}</div> : children}
    </section>
  );
}

function TrendCard({
  points,
  range,
}: {
  points: DashboardSummary["patientsOverTime"];
  range: ReportingRange;
}) {
  const table = (
    <table className="mini-data-table">
      <caption className="sr-only">Patient registrations over time</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">New patients</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.date}>
            <td>{formatBucket(point.date, range)}</td>
            <td>{point.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartCard
      className="trend-card"
      title="Patients over time"
      description={`New patient records · ${ranges.find((item) => item.value === range)?.label.toLowerCase()}`}
      table={table}
    >
      {points.length ? (
        <TrendGraph points={points} range={range} />
      ) : (
        <EmptyChart>No patients in this period</EmptyChart>
      )}
    </ChartCard>
  );
}

function ConditionCard({ data }: { data: DashboardSummary }) {
  const rows = data.patientsByCondition;
  const table = (
    <table className="mini-data-table">
      <caption className="sr-only">Patients by condition</caption>
      <thead>
        <tr>
          <th scope="col">Condition</th>
          <th scope="col">Patients</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.condition}>
            <td>
              {row.isGrouped ? (
                row.condition
              ) : (
                <Link href={`/patients?condition=${encodeURIComponent(row.condition)}`}>
                  {row.condition}
                </Link>
              )}
            </td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartCard
      className="condition-card"
      title="Patients by condition"
      description={`${numberFormat.format(data.kpis.totalPatients)} patients · all time`}
      table={table}
    >
      {rows.length ? (
        <ConditionDonut rows={rows} total={data.kpis.totalPatients} />
      ) : (
        <EmptyChart>No patient records yet</EmptyChart>
      )}
    </ChartCard>
  );
}

function DoctorLoadCard({ data }: { data: DashboardSummary }) {
  const doctors = data.patientsPerDoctor;
  const table = (
    <table className="mini-data-table">
      <caption className="sr-only">Patients per doctor</caption>
      <thead>
        <tr>
          <th scope="col">Doctor</th>
          <th scope="col">Patients</th>
        </tr>
      </thead>
      <tbody>
        {doctors.map((doctor) => (
          <tr key={doctor.doctorId}>
            <td>
              <Link href={`/doctors/${doctor.doctorId}`}>{doctor.name}</Link>
            </td>
            <td>{doctor.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartCard
      title="Patients per doctor"
      description="Top 8 by current patient count"
      table={table}
    >
      {doctors.length ? (
        <DoctorLoadChart rows={doctors} />
      ) : (
        <EmptyChart>No assigned patients yet</EmptyChart>
      )}
    </ChartCard>
  );
}

function SpecializationCard({ data }: { data: DashboardSummary }) {
  const rows = data.doctorsBySpecialization;
  const table = (
    <table className="mini-data-table">
      <caption className="sr-only">Doctors by specialization</caption>
      <thead>
        <tr>
          <th scope="col">Specialization</th>
          <th scope="col">Doctors</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.specialization}>
            <td>{row.specialization}</td>
            <td>{row.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <ChartCard
      title="Doctors by specialization"
      description="Current directory · all time"
      table={table}
    >
      {rows.length ? (
        <SpecializationChart rows={rows} />
      ) : (
        <EmptyChart>No doctors in the directory</EmptyChart>
      )}
    </ChartCard>
  );
}

function RecentPatients({ rows }: { rows: DashboardSummary["recentPatients"] }) {
  return (
    <section className="recent-patients-card" aria-labelledby="recent-patients-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Latest activity</p>
          <h2 id="recent-patients-title">Recent patients</h2>
        </div>
        <Link className="table-primary-link" href="/patients">
          View all patients →
        </Link>
      </div>
      {rows.length ? (
        <div className="data-card">
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">Five most recently added patients</caption>
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Doctor</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <strong>{patient.name}</strong>
                    </td>
                    <td>
                      <Link className="table-primary-link" href={`/doctors/${patient.doctorId}`}>
                        {patient.doctorName}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/patients?condition=${encodeURIComponent(patient.condition)}`}>
                        {patient.condition}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`status-chip status-${patient.status.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                        new Date(patient.createdAt),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="data-card">
          <EmptyChart>No patients have been added yet</EmptyChart>
        </div>
      )}
    </section>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return <div className="chart-empty">{children}</div>;
}
function formatBucket(date: string, range: ReportingRange) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: range === "12m" ? undefined : "numeric",
    year: range === "12m" ? "2-digit" : undefined,
  }).format(new Date(`${date}T12:00:00`));
}
function DashboardSkeleton() {
  return (
    <>
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="kpi-card skeleton-kpi" key={item}>
            <span className="skeleton skeleton-heading" />
            <span className="skeleton skeleton-value" />
            <span className="skeleton skeleton-caption" />
          </div>
        ))}
      </div>
      <div className="dashboard-chart-grid">
        {[0, 1, 2, 3].map((item) => (
          <div className="chart-card skeleton-chart" key={item}>
            <span className="skeleton skeleton-heading" />
            <span className="skeleton skeleton-panel" />
          </div>
        ))}
      </div>
    </>
  );
}
