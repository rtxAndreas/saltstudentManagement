import { FiTag } from "react-icons/fi";
import type { Period } from "../_types";
import { PeriodItem } from "./PeriodItem";

interface Props {
  periods: Period[];
  loading: boolean;
  onToggleStatus: (id: number, currentStatus: "DRAFT" | "CLOSED") => void;
  onDelete: (id: number) => void;
}

export function PeriodList({
  periods,
  loading,
  onToggleStatus,
  onDelete,
}: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Academic periods
        </h3>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
          {periods.length} total
        </span>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading periods...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
              <FiTag className="text-2xl text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                No periods yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first academic period.
              </p>
            </div>
          </div>
        ) : (
          periods.map((period) => (
            <PeriodItem
              key={period.periodId}
              period={period}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
