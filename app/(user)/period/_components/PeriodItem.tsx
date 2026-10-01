import {
  FiAlertCircle,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiTag,
  FiTrash2,
} from "react-icons/fi";
import type { Period } from "../_types";

interface Props {
  period: Period;
  onToggleStatus: (id: number, currentStatus: "DRAFT" | "CLOSED") => void;
  onDelete: (id: number) => void;
}

export function PeriodItem({ period, onToggleStatus, onDelete }: Props) {
  const isDraft = period.status === "DRAFT";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isDraft
          ? "bg-gray-50 border-gray-900/10"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDraft ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <FiTag className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">
                {period.label}
              </h4>
              {period.schoolYear && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FiBookOpen className="text-[10px]" />
                  {period.schoolYear.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <FiCalendar className="text-[11px]" />
                {new Date(period.startDate).toLocaleDateString()} —{" "}
                {new Date(period.endDate).toLocaleDateString()}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isDraft
                    ? "text-blue-700 bg-blue-50 border-blue-100"
                    : "text-gray-600 bg-gray-50 border-gray-100"
                }`}
              >
                {isDraft ? (
                  <>
                    <FiCheckCircle className="text-[10px]" /> Draft
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="text-[10px]" /> Closed
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(period.periodId, period.status)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
          >
            {isDraft ? "Close Period" : "Set to Draft"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(period.periodId)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
            aria-label={`Delete ${period.label}`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}
