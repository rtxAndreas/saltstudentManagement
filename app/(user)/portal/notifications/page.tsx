"use client";

import { PortalTitle, usePortal } from "../_components/PortalProvider";

export default function PortalNotificationsPage() {
  const { data, markNotificationRead } = usePortal();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PortalTitle
        title="Notifications"
        subtitle={`${data.notifications.filter((item) => !item.readAt).length} non lue(s)`}
      />
      <section className="space-y-3">
        {data.notifications.length ? (
          data.notifications.map((item) => (
            <button
              type="button"
              key={item.notification.notificationId}
              onClick={() => {
                if (!item.readAt)
                  markNotificationRead(item.notification.notificationId);
              }}
              className={`block w-full rounded-2xl border p-5 text-left shadow-sm ${
                item.readAt ? "bg-white" : "border-blue-300 bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <b>{item.notification.title}</b>
                {!item.readAt && (
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                    Nouveau
                  </span>
                )}
              </div>
              <p className="mt-1">{item.notification.message}</p>
              <span className="text-xs text-gray-500">
                {new Date(item.notification.publishedAt).toLocaleString(
                  "fr-FR",
                )}
              </span>
            </button>
          ))
        ) : (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-gray-500">Aucune notification.</p>
          </div>
        )}
      </section>
    </div>
  );
}
