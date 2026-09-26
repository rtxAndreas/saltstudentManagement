"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ChildData, PortalData } from "../_types";

interface PortalContextValue {
  data: PortalData | null;
  loading: boolean;
  error: string;
  child: ChildData | null;
  childrenList: ChildData[];
  selectedId: number | null;
  setSelectedId: (studentId: number) => void;
  updateRsvp: (
    eventId: number,
    response: "ATTENDING" | "DECLINED",
  ) => Promise<string | null>;
  markNotificationRead: (notificationId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/portal");
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    setData(json);
    setSelectedId(
      (current) => current ?? json.children[0]?.student.studentId ?? null,
    );
  }, []);

  useEffect(() => {
    // Initial data loading synchronizes the page with the API once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Erreur de chargement.",
        ),
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  const child = useMemo(
    () =>
      data?.children.find((item) => item.student.studentId === selectedId) ??
      data?.children[0] ??
      null,
    [data, selectedId],
  );

  const updateRsvp = useCallback(
    async (eventId: number, response: "ATTENDING" | "DECLINED") => {
      const result = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!result.ok) {
        const body = await result.json().catch(() => ({}));
        return body.error ?? "Impossible d’enregistrer votre réponse.";
      }
      setData((current) =>
        current
          ? {
              ...current,
              events: current.events.map((item) =>
                item.event.eventId === eventId ? { ...item, response } : item,
              ),
            }
          : current,
      );
      return null;
    },
    [],
  );

  const markNotificationRead = useCallback(async (notificationId: number) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });
    setData((current) =>
      current
        ? {
            ...current,
            notifications: current.notifications.map((entry) =>
              entry.notification.notificationId === notificationId &&
              !entry.readAt
                ? { ...entry, readAt: new Date().toISOString() }
                : entry,
            ),
          }
        : current,
    );
  }, []);

  return (
    <PortalContext.Provider
      value={{
        data,
        loading,
        error,
        child,
        childrenList: data?.children ?? [],
        selectedId,
        setSelectedId,
        updateRsvp,
        markNotificationRead,
        refresh,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal must be used within PortalProvider");
  return context;
}

export function PortalStatus() {
  const { data, error, loading, child } = usePortal();
  if (error)
    return <div className="rounded-xl bg-red-50 p-5 text-red-800">{error}</div>;
  if (loading || !data)
    return <div className="p-8">Chargement de votre espace…</div>;
  if (!child)
    return (
      <div className="rounded-xl bg-amber-50 p-5 text-amber-800">
        Aucun dossier élève n’est rattaché à votre compte.
      </div>
    );
  return null;
}

export function PortalTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
    </div>
  );
}
