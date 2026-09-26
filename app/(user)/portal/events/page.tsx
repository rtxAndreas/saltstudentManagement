"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";
import { responseLabels } from "../_types";

export default function PortalEventsPage() {
  const { data, updateRsvp } = usePortal();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Conférences et événements"
        subtitle="Réunions scolaires et confirmations de présence"
      />
      <section className="space-y-3">
        {data.events.length ? (
          data.events.map((item) => (
            <div
              key={item.event.eventId}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>{item.event.title}</b>
                <span className="text-sm text-gray-500">
                  {new Date(item.event.startsAt).toLocaleString("fr-FR")}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {item.event.description}
              </p>
              <p className="text-sm text-gray-500">
                Lieu : {item.event.location ?? "À confirmer"}
              </p>
              {item.event.requiresConfirmation && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {responseLabels[item.response] ?? item.response}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateRsvp(item.event.eventId, "ATTENDING")}
                    className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Je participerai
                  </button>
                  <button
                    type="button"
                    onClick={() => updateRsvp(item.event.eventId, "DECLINED")}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700"
                  >
                    Je ne participerai pas
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-gray-500">Aucun événement à venir.</p>
          </div>
        )}
      </section>
    </div>
  );
}
