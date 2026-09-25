"use client";

import { type ReactNode, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiSearch,
  FiX,
} from "react-icons/fi";

export interface DynamicColumn<T> {
  key: string;
  header: string;
  hideable?: boolean;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: DynamicColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  isLoading?: boolean;
  countLabel: string;
  searchText?: (row: T) => string;
  emptyTitle?: string;
  emptyMessage?: string;
  toolbarActions?: ReactNode;
  pageSizeOptions?: number[];
}

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

const SKELETON_ROWS = Array.from(
  { length: 5 },
  (_, index) => `skeleton-${index}`,
);

const paginationButton =
  "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700";

export function DynamicTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  countLabel,
  searchText,
  emptyTitle = "Aucun résultat",
  emptyMessage = "Essayez de modifier votre recherche ou vos filtres.",
  toolbarActions,
  pageSizeOptions = [10, 25, 50],
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const hideableColumns = columns.filter((column) => column.hideable !== false);
  const [visible, setVisible] = useState<Set<string>>(
    () => new Set(columns.map((column) => column.key)),
  );

  const toggleColumn = (key: string) => {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        if (current.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    let rows = data.slice();
    const query = search.trim().toLowerCase();
    if (query && searchText) {
      rows = rows.filter((row) =>
        searchText(row).toLowerCase().includes(query),
      );
    }
    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      if (column?.sortable && column.sortValue) {
        rows = rows.slice().sort((a, b) => {
          const left = column.sortValue!(a);
          const right = column.sortValue!(b);
          if (typeof left === "number" && typeof right === "number") {
            return (left - right) * sort.dir;
          }
          return String(left).localeCompare(String(right)) * sort.dir;
        });
      }
    }
    return rows;
  }, [data, search, searchText, sort, columns]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * limit,
    currentPage * limit,
  );
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);
  const pageOffset = (currentPage - 1) * limit;

  const show = (key: string) => visible.has(key);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {total.toLocaleString("fr-FR")}{" "}
            <b className="text-slate-700">{countLabel}</b>
          </span>
          {searchText && (
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Rechercher…"
                aria-label="Rechercher"
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {toolbarActions}
          {hideableColumns.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnsOpen((current) => !current)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <FiChevronDown size={14} />
                Colonnes
              </button>
              {columnsOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <div className="flex items-center justify-between px-2 pb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Colonnes affichées
                    </span>
                    <button
                      type="button"
                      onClick={() => setColumnsOpen(false)}
                      aria-label="Fermer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                  {hideableColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={show(column.key)}
                        onChange={() => toggleColumn(column.key)}
                        className="accent-blue-600"
                      />
                      {column.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              {columns.map((column) => {
                if (!show(column.key)) return null;
                const active = sort?.key === column.key;
                return (
                  <th
                    key={column.key}
                    className={`px-3 py-3 ${column.className ?? ""}`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((current) =>
                            active && current?.dir === 1
                              ? { key: column.key, dir: -1 }
                              : { key: column.key, dir: 1 },
                          )
                        }
                        className="inline-flex items-center gap-1 hover:text-slate-800"
                      >
                        {column.header}
                        {active &&
                          (sort!.dir === 1 ? (
                            <FiChevronUp size={14} />
                          ) : (
                            <FiChevronDown size={14} />
                          ))}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && total === 0
              ? SKELETON_ROWS.map((rowKey) => (
                  <tr
                    key={rowKey}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td colSpan={columns.length + 1} className="px-4 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              : pageRows.map((row, index) => (
                  <tr
                    key={keyExtractor(row)}
                    className={`border-b border-slate-50 transition-colors last:border-0 hover:bg-blue-50/40 ${
                      isLoading ? "opacity-50" : ""
                    }`}
                  >
                    {columns.map((column) => {
                      if (!show(column.key)) return null;
                      return (
                        <td
                          key={column.key}
                          className={`px-3 py-3 ${column.className ?? ""}`}
                        >
                          {column.key === "#"
                            ? pageOffset + index + 1
                            : column.render?.(row)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
            {!isLoading && total === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-6 py-14 text-center"
                >
                  <p className="font-semibold text-slate-700">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            Affichage de{" "}
            <b className="text-slate-700">{from.toLocaleString("fr-FR")}</b> à{" "}
            <b className="text-slate-700">{to.toLocaleString("fr-FR")}</b> sur{" "}
            <b className="text-slate-700">{total.toLocaleString("fr-FR")}</b>{" "}
            {countLabel}
          </span>
          <select
            aria-label="Éléments par page"
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          >
            {pageSizeOptions.map((value) => (
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
            disabled={currentPage === 1}
            onClick={() => setPage(1)}
            className={
              paginationButton +
              " border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            «
          </button>
          <button
            type="button"
            aria-label="Page précédente"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className={
              paginationButton +
              " border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            <FiChevronLeft size={15} />
          </button>
          {pageEntries(currentPage, totalPages).map(({ key, value }) =>
            value === "…" ? (
              <span key={key} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={value}
                type="button"
                onClick={() => setPage(value)}
                aria-current={value === currentPage ? "page" : undefined}
                className={
                  value === currentPage
                    ? paginationButton +
                      " border-blue-600 bg-blue-600 text-white"
                    : paginationButton +
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
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
            className={
              paginationButton +
              " border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            <FiChevronRight size={15} />
          </button>
          <button
            type="button"
            aria-label="Dernière page"
            disabled={currentPage === totalPages}
            onClick={() => setPage(totalPages)}
            className={
              paginationButton +
              " border-slate-200 text-slate-600 hover:bg-slate-50"
            }
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

export { iconButton };
