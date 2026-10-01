import {
  FiAlertCircle,
  FiBookOpen,
  FiCheckCircle,
  FiLayers,
  FiTrash2,
} from "react-icons/fi";
import type { Class } from "../_types";

interface Props {
  classItem: Class;
  onToggleStatus: (id: number, currentStatus: "ACTIVE" | "INACTIVE") => void;
  onDelete: (id: number) => void;
}

export function ClassItem({ classItem, onToggleStatus, onDelete }: Props) {
  const isActive = classItem.status === "ACTIVE";

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isActive
          ? "bg-white border-gray-100 hover:border-gray-200"
          : "bg-gray-50 border-gray-900/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-gray-900">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            <FiLayers className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">
                {classItem.name}
              </h4>
              {classItem.schoolYear && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <FiBookOpen className="text-[10px]" />
                  {classItem.schoolYear.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">
                Level: {classItem.level}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isActive
                    ? "text-green-700 bg-green-50 border-green-100"
                    : "text-gray-600 bg-gray-50 border-gray-100"
                }`}
              >
                {isActive ? (
                  <>
                    <FiCheckCircle className="text-[10px]" /> Active
                  </>
                ) : (
                  <>
                    <FiAlertCircle className="text-[10px]" /> Inactive
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(classItem.classId, classItem.status)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(classItem.classId)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
            aria-label={`Delete ${classItem.name}`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
}
