"use client";

import { FiUserCheck, FiUserMinus, FiUserPlus, FiUsers } from "react-icons/fi";
import type { StudentStats as StudentStatsData } from "../_hooks/useStudentDirectory";

export function StudentStats({ stats }: { stats: StudentStatsData | null }) {
  const cards = [
    {
      label: "Total élèves",
      value: stats?.total,
      icon: <FiUsers size={16} />,
      badgeClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Élèves actifs",
      value: stats?.active,
      icon: <FiUserCheck size={16} />,
      badgeClass: "bg-green-50 text-green-700",
    },
    {
      label: "Élèves inactifs",
      value: stats?.inactive,
      icon: <FiUserMinus size={16} />,
      badgeClass: "bg-orange-50 text-orange-700",
    },
    {
      label: "Nouvelles inscriptions",
      value: stats?.newEnrollments,
      suffix: "cette année",
      icon: <FiUserPlus size={16} />,
      badgeClass: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div>
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="text-xl font-bold text-slate-800">
              {card.value == null ? (
                <span className="inline-block h-6 w-12 animate-pulse rounded bg-slate-100" />
              ) : (
                card.value.toLocaleString("fr-FR")
              )}
              {card.suffix && (
                <span className="ml-1 text-xs font-medium text-slate-400">
                  {card.suffix}
                </span>
              )}
            </p>
          </div>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.badgeClass}`}
          >
            {card.icon}
          </span>
        </div>
      ))}
    </div>
  );
}
