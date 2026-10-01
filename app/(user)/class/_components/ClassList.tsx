import { FiLayers } from "react-icons/fi";
import type { Class } from "../_types";
import { ClassItem } from "./ClassItem";

interface Props {
  classes: Class[];
  loading: boolean;
  onToggleStatus: (id: number, currentStatus: "ACTIVE" | "INACTIVE") => void;
  onDelete: (id: number) => void;
}

export function ClassList({
  classes,
  loading,
  onToggleStatus,
  onDelete,
}: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden text-gray-900 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Classes</h3>
        <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
          {classes.length} total
        </span>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
              <FiLayers className="text-2xl text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                No classes yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Create your first class for the active school year.
              </p>
            </div>
          </div>
        ) : (
          classes.map((cls) => (
            <ClassItem
              key={cls.classId}
              classItem={cls}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
