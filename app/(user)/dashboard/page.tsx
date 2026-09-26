"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiDollarSign,
  FiGrid,
  FiLayers,
  FiMapPin,
  FiSun,
  FiUserCheck,
  FiUsers,
  FiVideo,
} from "react-icons/fi";
import Loading from "../../components/ui/Loading";

type Year = { schoolYearId: number; label: string };
type Period = { periodId: number; label: string; schoolYearId: number };

type Stats = {
  schoolYear: { schoolYearId: number; label: string };
  selectedPeriodId: number | null;
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  gender: { boys: number; girls: number };
  byClass: { classId: number; className: string; count: number }[];
  evaluatedByPeriod: { periodId: number; label: string; evaluated: number }[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    rate: number;
  };
  finance: {
    billed: number;
    paid: number;
    remaining: number;
    rate: number;
    paidInvoices: number;
    overdueInvoices: number;
  };
  upcomingAssessments: {
    assessmentId: number;
    title: string;
    type: string;
    scheduledAt: string;
    assignment: { course: { name: string; code: string } };
    period: { label: string };
  }[];
  upcomingExamSlots: {
    examSlotId: number;
    startsAt: string;
    endsAt: string;
    examSession: { title: string };
    assignment: {
      course: { name: string; code: string };
      class: { name: string };
    };
  }[];
  upcomingEvents: {
    eventId: number;
    title: string;
    type: string;
    startsAt: string;
    endsAt: string;
    location: string | null;
    requiresConfirmation: boolean;
  }[];
};

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erreur de chargement");
  return response.json();
}

const nf = (n: number) => n.toLocaleString("fr-FR");
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

const assessmentTypeStyle: Record<string, { label: string; cls: string }> = {
  QUIZ: {
    label: "Exercice",
    cls: "bg-slate-100 text-slate-600 border-slate-200",
  },
  HOMEWORK: {
    label: "Devoir",
    cls: "bg-violet-50 text-violet-700 border-violet-100",
  },
  PROJECT: {
    label: "Projet",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  EXAM: {
    label: "Examen",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  RESIT: { label: "Rattrapage", cls: "bg-red-50 text-red-700 border-red-100" },
};

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
  ariaLabel?: string;
}

function Donut({
  segments,
  size = 150,
  thickness = 22,
  center,
  ariaLabel = "Répartition",
}: DonutProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <svg
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label={ariaLabel}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={thickness}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-slate-400 text-sm font-semibold"
        >
          0
        </text>
      </svg>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={ariaLabel}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={thickness}
        />
        {segments.map((segment, index) => {
          const dash = (segment.value / total) * circumference;
          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={
                (-segments
                  .slice(0, index)
                  .reduce((sum, s) => sum + s.value, 0) /
                  total) *
                circumference
              }
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center">
          {center}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 p-5 ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-400">
      {message}
    </p>
  );
}

export default function DashboardPage() {
  const { data: years = [], isLoading: yearsLoading } = useQuery({
    queryKey: ["dashboard-years"],
    queryFn: () => get<Year[]>("/api/schoolYear"),
  });
  const [yearId, setYearId] = useState(0);
  const [periodId, setPeriodId] = useState(0);
  const selectedYearId = yearId || years[0]?.schoolYearId || 0;
  const { data: periods = [] } = useQuery({
    queryKey: ["dashboard-periods"],
    queryFn: () => get<Period[]>("/api/period"),
  });
  const availablePeriods = useMemo(
    () => periods.filter((p) => p.schoolYearId === selectedYearId),
    [periods, selectedYearId],
  );
  const selectedPeriodId = availablePeriods.some((p) => p.periodId === periodId)
    ? periodId
    : 0;
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedYearId, selectedPeriodId],
    queryFn: () =>
      get<Stats>(
        `/api/dashboard/stats?schoolYearId=${selectedYearId}&periodId=${selectedPeriodId}`,
      ),
    enabled: selectedYearId > 0,
  });

  if (yearsLoading || isLoading || !stats) return <Loading skeleton />;

  const { gender, attendance, finance, byClass, evaluatedByPeriod } = stats;
  const genderTotal = gender.boys + gender.girls;
  const boysPct =
    genderTotal > 0 ? Math.round((gender.boys / genderTotal) * 100) : 0;
  const girlsPct =
    genderTotal > 0 ? Math.round((gender.girls / genderTotal) * 100) : 0;
  const maxClass = Math.max(...byClass.map((x) => x.count), 1);
  const maxEvaluated = Math.max(
    ...evaluatedByPeriod.map((x) => x.evaluated),
    1,
  );

  const attendanceSegments = [
    { label: "Présents", value: attendance.present, color: "#10b981" },
    { label: "Retards", value: attendance.late, color: "#f59e0b" },
    { label: "Absents", value: attendance.absent, color: "#ef4444" },
    { label: "Excusés", value: attendance.excused, color: "#94a3b8" },
  ];

  const eventTypeIcon: Record<string, { icon: ReactNode; cls: string }> = {
    CONFERENCE: {
      icon: <FiVideo size={15} />,
      cls: "bg-slate-500/10 text-slate-600",
    },
    PARENT_MEETING: {
      icon: <FiUsers size={15} />,
      cls: "bg-slate-500/10 text-slate-600",
    },
    SCHOOL_EVENT: {
      icon: <FiCalendar size={15} />,
      cls: "bg-slate-500/10 text-slate-600",
    },
    HOLIDAY: {
      icon: <FiSun size={15} />,
      cls: "bg-slate-500/10 text-slate-600",
    },
  };

  const kpis = [
    {
      label: "Total élèves",
      value: nf(stats.totalStudents),
      icon: <FiUsers size={18} />,
      tile: "bg-slate-500/10 text-slate-600",
      sub: `${nf(byClass.length)} classes`,
    },
    {
      label: "Classes",
      value: nf(stats.totalClasses),
      icon: <FiGrid size={18} />,
      tile: "bg-slate-500/10 text-slate-600",
      sub: "Actives cette année",
    },
    {
      label: "Enseignants",
      value: nf(stats.totalTeachers),
      icon: <FiUserCheck size={18} />,
      tile: "bg-slate-500/10 text-slate-600",
      sub: "Comptes actifs",
    },
    {
      label: "Taux de présence",
      value: `${Math.round(attendance.rate)} %`,
      icon: <FiActivity size={18} />,
      tile: "bg-slate-500/10 text-slate-600",
      sub:
        attendance.total > 0
          ? `${nf(attendance.total)} séances enregistrées`
          : "Aucune séance",
    },
    {
      label: "Collecte des frais",
      value: `${Math.round(finance.rate)} %`,
      icon: <FiDollarSign size={18} />,
      tile: "bg-slate-500/10 text-slate-600",
      sub:
        finance.billed > 0
          ? `${nf(finance.paid)} sur ${nf(finance.billed)} encaissés`
          : "Aucune facture",
    },
  ];

  return (
    <div className="space-y-6 p-2">
      {/* Hero */}
      <div className="rounded-2xl border border-slate-200/80 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <FiLayers /> Vue générale
            </p>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Effectifs, présence, paiements et échéances —{" "}
              {stats.schoolYear.label}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm font-medium text-slate-500">
              Année scolaire
              <select
                className="mt-1 block rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-800 shadow-sm outline-none"
                value={selectedYearId}
                onChange={(event) => {
                  setYearId(Number(event.target.value));
                  setPeriodId(0);
                }}
              >
                {years.map((year) => (
                  <option key={year.schoolYearId} value={year.schoolYearId}>
                    {year.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-500">
              Période
              <select
                className="mt-1 block rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-800 shadow-sm outline-none"
                value={selectedPeriodId}
                onChange={(event) => setPeriodId(Number(event.target.value))}
              >
                <option value={0}>Toutes</option>
                {availablePeriods.map((period) => (
                  <option key={period.periodId} value={period.periodId}>
                    {period.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200/80 p-5 transition-shadow hover:shadow-md"
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${kpi.tile}`}
            >
              {kpi.icon}
            </div>
            <p className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              {kpi.value}
            </p>
            <p className="mt-1 text-sm text-gray-500">{kpi.label}</p>
            {kpi.sub && (
              <p className="mt-0.5 text-xs text-slate-400">{kpi.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Répartition + présence */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          title="Répartition par sexe"
          icon={<FiUsers size={16} />}
          className="lg:col-span-2"
        >
          {genderTotal === 0 ? (
            <EmptyState message="Aucun élève inscrit pour cette année." />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <Donut
                segments={[
                  { label: "Garçons", value: gender.boys, color: "#334155" },
                  { label: "Filles", value: gender.girls, color: "#ec4899" },
                ]}
                ariaLabel="Répartition des élèves par genre"
                center={
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700">
                      {genderTotal}
                    </p>
                    <p className="text-xs text-slate-400">élèves</p>
                  </div>
                }
              />
              <div className="w-full max-w-[180px] space-y-3 text-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />{" "}
                      Garçons
                    </span>
                    <b className="text-slate-700">{gender.boys}</b>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-slate-100">
                    <div
                      className="h-1.5 rounded bg-slate-600"
                      style={{ width: `${boysPct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{boysPct}%</p>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />{" "}
                      Filles
                    </span>
                    <b className="text-slate-700">{gender.girls}</b>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-slate-100">
                    <div
                      className="h-1.5 rounded bg-pink-500"
                      style={{ width: `${girlsPct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{girlsPct}%</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Présences enregistrées"
          icon={<FiActivity size={16} />}
          className="lg:col-span-3"
        >
          {attendance.total === 0 ? (
            <EmptyState message="Aucune présence enregistrée pour cette année." />
          ) : (
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
              <Donut
                segments={attendanceSegments}
                ariaLabel="Répartition des présences"
                size={170}
                thickness={24}
                center={
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700">
                      {Math.round(attendance.rate)}%
                    </p>
                    <p className="text-xs text-slate-400">de présence</p>
                  </div>
                }
              />
              <div className="grid w-full max-w-[320px] grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <FiCheckCircle className="text-emerald-500" size={14} />{" "}
                    Présents
                  </span>
                  <b className="text-slate-700">{nf(attendance.present)}</b>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <FiClock className="text-amber-500" size={14} /> Retards
                  </span>
                  <b className="text-slate-700">{nf(attendance.late)}</b>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <FiAlertCircle className="text-red-500" size={14} /> Absents
                  </span>
                  <b className="text-slate-700">{nf(attendance.absent)}</b>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-600">
                    <FiCalendar className="text-slate-400" size={14} /> Excusés
                  </span>
                  <b className="text-slate-700">{nf(attendance.excused)}</b>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Répartition par classe */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card
          title="Élèves par classe"
          icon={<FiGrid size={16} />}
          action={
            <span className="text-xs font-medium text-slate-400">
              Effectif total : {nf(stats.totalStudents)}
            </span>
          }
          className="lg:col-span-3"
        >
          {byClass.length === 0 ? (
            <EmptyState message="Aucune classe pour cette année scolaire." />
          ) : (
            <div className="space-y-3">
              {byClass.map((item) => (
                <div key={item.classId} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-slate-600">
                    {item.className}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="h-3 rounded-md bg-gradient-to-r from-slate-500 to-slate-400 transition-all"
                      style={{
                        width: `${Math.max((item.count / maxClass) * 100, 4)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm font-bold text-slate-700">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Élèves évalués par période"
          icon={<FiClipboard size={16} />}
          className="lg:col-span-2"
        >
          {evaluatedByPeriod.length === 0 ? (
            <EmptyState message="Aucune évaluation pour cette année." />
          ) : (
            <div className="flex h-44 items-end justify-around gap-3">
              {evaluatedByPeriod.map((item) => (
                <div
                  key={item.periodId}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {nf(item.evaluated)}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                    style={{
                      height: `${Math.max((item.evaluated / maxEvaluated) * 120, 6)}px`,
                    }}
                    title={`${item.label} : ${item.evaluated} élève(s) évalué(s)`}
                  />
                  <span className="truncate text-xs text-slate-500">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Échéances */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Prochaines évaluations" icon={<FiClipboard size={16} />}>
          {stats.upcomingAssessments.length === 0 ? (
            <EmptyState message="Aucune évaluation planifiée." />
          ) : (
            <ul className="space-y-3">
              {stats.upcomingAssessments.map((item) => {
                const badge = assessmentTypeStyle[item.type] ?? {
                  label: item.type,
                  cls: "bg-slate-100 text-slate-600 border-slate-200",
                };
                return (
                  <li
                    key={item.assessmentId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.assignment.course.name} · {item.period.label}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {dayLabel(item.scheduledAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Prochains examens" icon={<FiBookOpen size={16} />}>
          {stats.upcomingExamSlots.length === 0 ? (
            <EmptyState message="Aucune session d’examen planifiée." />
          ) : (
            <ul className="space-y-3">
              {stats.upcomingExamSlots.map((item) => (
                <li
                  key={item.examSlotId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.examSession.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {item.assignment.course.name} ·{" "}
                      {item.assignment.class.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-medium text-slate-600">
                      {dayLabel(item.startsAt)}
                    </p>
                    <p className="text-slate-400">
                      {timeLabel(item.startsAt)} – {timeLabel(item.endsAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Événements à venir" icon={<FiCalendar size={16} />}>
          {stats.upcomingEvents.length === 0 ? (
            <EmptyState message="Aucun événement planifié." />
          ) : (
            <ul className="space-y-3">
              {stats.upcomingEvents.map((item) => {
                const meta = eventTypeIcon[item.type] ?? {
                  icon: <FiCalendar size={15} />,
                  cls: "bg-slate-100 text-slate-600",
                };
                return (
                  <li
                    key={item.eventId}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {dayLabel(item.startsAt)} · {timeLabel(item.startsAt)}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                    </div>
                    {item.requiresConfirmation && (
                      <FiCheckCircle
                        className="shrink-0 text-emerald-500"
                        size={15}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* situation financière */}
      <Card
        title="Situation financière de l’année"
        icon={<FiDollarSign size={16} />}
        action={
          <span className="text-xs font-medium text-slate-400">
            {finance.billed > 0
              ? `${nf(finance.paidInvoices)} factures payées`
              : ""}
            {finance.overdueInvoices > 0
              ? ` · ${nf(finance.overdueInvoices)} en retard`
              : ""}
          </span>
        }
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Facturé
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {nf(finance.billed)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
              Encaissé
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {nf(finance.paid)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-amber-50/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
              Restant dû
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {nf(finance.remaining)}
            </p>
          </div>
        </div>
        {finance.billed > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Taux de recouvrement</span>
              <b className="text-slate-700">{Math.round(finance.rate)}%</b>
            </div>
            <div className="h-2.5 overflow-hidden rounded-md bg-slate-100">
              <div
                className="h-2.5 rounded-md bg-gradient-to-r from-emerald-500 to-emerald-400"
                style={{ width: `${Math.min(finance.rate, 100)}%` }}
              />
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/finance"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
          >
            <FiDollarSign size={15} /> Gérer l’écolage
          </Link>
        </div>
      </Card>

      {/* note d'icône salle */}
      <p className="flex items-center gap-2 text-xs text-slate-400">
        <FiMapPin size={13} />
        Données basées sur {stats.schoolYear.label}
        {selectedPeriodId
          ? " · période sélectionnée."
          : " · toutes périodes confondues."}
      </p>
    </div>
  );
}
