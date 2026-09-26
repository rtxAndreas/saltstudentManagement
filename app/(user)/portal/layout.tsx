"use client";

import {
  PortalProvider,
  PortalStatus,
  usePortal,
} from "./_components/PortalProvider";

function ChildSelector() {
  const { data, child, setSelectedId } = usePortal();
  if (!data || data.role !== "PARENT" || data.children.length <= 1 || !child)
    return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className="text-sm font-semibold text-gray-500">
        Enfant suivi :
      </span>
      <select
        aria-label="Enfant suivi"
        className="rounded-lg border p-2 font-semibold"
        value={child.student.studentId}
        onChange={(event) => setSelectedId(Number(event.target.value))}
      >
        {data.children.map((item) => (
          <option key={item.student.studentId} value={item.student.studentId}>
            {item.student.firstname} {item.student.lastname} ·{" "}
            {item.student.class.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalProvider>
      <div className="mx-auto max-w-7xl space-y-6 p-3 text-gray-900">
        <PortalStatus />
        <ChildSelector />
        {children}
      </div>
    </PortalProvider>
  );
}
