// import { FiRefreshCw } from "react-icons/fi";
// import { useSchoolYears } from "../_hooks/useSchoolYear"
// import Loading from "@/app/components/ui/Loading";

// export function HeaderSchoolYearPage() {
//     const { handleRefresh, loading } = useSchoolYears();
//     if (loading && useSchoolYears.length === 0) {
//         return <Loading skeleton />
//     }
//     return (
//         <div className="min-h-screen bg-gray">
//             <div className="flex items-start justify-between gap-6">
//                 <div>
//                     <h1 className="text-2xl font-semibold text-gray-900">
//                         School year management
//                     </h1>
//                     <p className="text-sm text-gray-500 mt-1">
//                         Define and manage academic cycles.
//                     </p>
//                 </div>
//                 <button
//                     type="button"
//                     onClick={handleRefresh}
//                     className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
//                 >
//                     <FiRefreshCw className={loading ? "animate-spin" : ""} />
//                     Refresh
//                 </button>
//             </div>
//         </div>
//     )
// }
