"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Props {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

/** Build a smart page list with ellipsis markers: 1 … 4 5 6 … 100 */
function pageList(current: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const pages = new Set<number>([
    1,
    totalPages,
    current - 1,
    current,
    current + 1,
  ]);
  if (current <= 3) for (const value of [2, 3, 4]) pages.add(value);
  if (current >= totalPages - 2) {
    for (const value of [totalPages - 1, totalPages - 2, totalPages - 3]) {
      pages.add(value);
    }
  }
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) result.push("…");
    result.push(value);
    previous = value;
  }
  return result;
}

function pageEntries(
  current: number,
  totalPages: number,
): Array<{ key: string; value: number | "…" }> {
  const entries: Array<{ key: string; value: number | "…" }> = [];
  let ellipsisCount = 0;
  for (const value of pageList(current, totalPages)) {
    entries.push({
      key: value === "…" ? `ellipsis-${ellipsisCount++}` : `page-${value}`,
      value,
    });
  }
  return entries;
}

const buttonBase =
  "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function StudentPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: Props) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Affichage de{" "}
          <b className="text-slate-700">{from.toLocaleString("fr-FR")}</b> à{" "}
          <b className="text-slate-700">{to.toLocaleString("fr-FR")}</b> sur{" "}
          <b className="text-slate-700">{total.toLocaleString("fr-FR")}</b>{" "}
          élèves
        </span>
        <select
          aria-label="Éléments par page"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-400"
        >
          {[10, 25, 50].map((value) => (
            <option key={value} value={value}>
              {value} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Première page"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          className={`${buttonBase} border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          «
        </button>
        <button
          type="button"
          aria-label="Page précédente"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`${buttonBase} border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          <FiChevronLeft size={15} />
        </button>
        {pageEntries(page, totalPages).map(({ key, value }) =>
          value === "…" ? (
            <span key={key} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={key}
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? "page" : undefined}
              className={
                value === page
                  ? `${buttonBase} border-blue-600 bg-blue-600 text-white`
                  : buttonBase +
                    " border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            >
              {value}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Page suivante"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`${buttonBase} border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          <FiChevronRight size={15} />
        </button>
        <button
          type="button"
          aria-label="Dernière page"
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`${buttonBase} border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          »
        </button>
      </div>
    </div>
  );
}
