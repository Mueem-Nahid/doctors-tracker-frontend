"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummary, ReportingRange } from "@doctor-tracker/contracts";

const palette = [
  "#0b8393",
  "#57b6a1",
  "#e0a34b",
  "#7d7ec7",
  "#dc756c",
  "#5f8ec7",
  "#a77ab9",
  "#89a84f",
  "#d28148",
  "#6e9eab",
  "#84909a",
];
const countFormat = new Intl.NumberFormat();

function bucketLabel(date: string, range: ReportingRange) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: range === "12m" ? undefined : "numeric",
    year: range === "12m" ? "2-digit" : undefined,
  }).format(new Date(`${date}T12:00:00`));
}

const tooltipStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  background: "var(--card)",
  color: "var(--foreground)",
  boxShadow: "var(--shadow-md)",
};

export function TrendGraph({
  points,
  range,
}: {
  points: DashboardSummary["patientsOverTime"];
  range: ReportingRange;
}) {
  const label = points.reduce((sum, point) => sum + point.count, 0);
  return (
    <div
      className="rechart trend-rechart"
      role="img"
      aria-label={`New patients over time, ${countFormat.format(label)} in the selected period`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="patientTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-main)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-main)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="date"
            tickFormatter={(date: string) => bucketLabel(date, range)}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            width={32}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(date) => bucketLabel(String(date), range)}
            formatter={(value) => [countFormat.format(Number(value)), "New patients"]}
            contentStyle={tooltipStyle}
          />
          <Area
            type="monotone"
            dataKey="count"
            name="New patients"
            stroke="var(--chart-main)"
            strokeWidth={2.5}
            fill="url(#patientTrendFill)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConditionDonut({
  rows,
  total,
}: {
  rows: DashboardSummary["patientsByCondition"];
  total: number;
}) {
  return (
    <div className="condition-chart">
      <div
        className="donut-plot"
        role="img"
        aria-label={`Patients by condition, ${countFormat.format(total)} total`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="condition"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={1}
              stroke="var(--card)"
            >
              {rows.map((row, index) => (
                <Cell key={row.condition} fill={palette[index % palette.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [countFormat.format(Number(value)), String(name)]}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center" aria-hidden="true">
          <strong>{countFormat.format(total)}</strong>
          <span>patients</span>
        </div>
      </div>
      <ul className="condition-legend">
        {rows.map((row, index) => (
          <li key={row.condition}>
            <span
              className="legend-dot"
              style={{ backgroundColor: palette[index % palette.length] }}
            />
            {row.isGrouped ? (
              <span>{row.condition}</span>
            ) : (
              <Link href={`/patients?condition=${encodeURIComponent(row.condition)}`}>
                {row.condition}
              </Link>
            )}
            <strong>{countFormat.format(row.count)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DoctorLoadChart({ rows }: { rows: DashboardSummary["patientsPerDoctor"] }) {
  const router = useRouter();
  return (
    <div
      className="rechart bar-rechart"
      role="img"
      aria-label={
        rows.length
          ? `Patients per doctor. Top: ${rows[0]!.name}, ${rows[0]!.count} patients`
          : "No assigned patients yet"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 2, right: 20, left: 0, bottom: 2 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={105}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [countFormat.format(Number(value)), "Patients"]}
            contentStyle={tooltipStyle}
          />
          <Bar
            dataKey="count"
            name="Patients"
            fill="var(--chart-main)"
            radius={[0, 4, 4, 0]}
            barSize={14}
            cursor="pointer"
            onClick={(entry) => {
              const doctorId = entry.payload?.doctorId as string | undefined;
              if (doctorId) router.push(`/doctors/${doctorId}`);
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpecializationChart({
  rows,
}: {
  rows: DashboardSummary["doctorsBySpecialization"];
}) {
  return (
    <div
      className="rechart bar-rechart"
      role="img"
      aria-label={
        rows.length
          ? `Doctors by specialization. Top: ${rows[0]!.specialization}, ${rows[0]!.count} doctors`
          : "No doctors in the directory"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 2, right: 20, left: 0, bottom: 2 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey="specialization"
            width={125}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [countFormat.format(Number(value)), "Doctors"]}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="count" name="Doctors" radius={[0, 4, 4, 0]} barSize={14}>
            {rows.map((row, index) => (
              <Cell key={row.specialization} fill={palette[index % palette.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
