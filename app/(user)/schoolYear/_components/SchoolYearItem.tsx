import { FiCalendar, FiCheckCircle, FiTag, FiTrash2 } from "react-icons/fi";
import type { SchoolYear } from "../_types";

interface Props {
  year: SchoolYear;
  onActivate: (id: number) => void;
  onDelete: (id: number) => void;
}

export function SchoolYearItem({ year, onActivate, onDelete }: Props) {
  const isActive = year.status === "ACTIVE";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isActive
          ? "bg-gray-50 border-gray-900/20"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <FiTag className="text-lg" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900">
              {year.label}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiCalendar className="text-[11px]" />
                {new Date(year.startDate).toLocaleDateString()} —{" "}
                {new Date(year.endDate).toLocaleDateString()}
              </span>
              {isActive && (
                <span className="text-[10px] font-semibold text-gray-900 bg-gray-900/8 border border-gray-900/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <FiCheckCircle className="text-[10px]" /> Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isActive && (
            <button
              type="button"
              onClick={() => onActivate(year.schoolYearId)}
              className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all"
            >
              Activate
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(year.schoolYearId)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
            aria-label={`Delete ${year.label}`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}
