"use client";

import { useQuery } from "@tanstack/react-query";
import Loading from "../../components/ui/Loading";
import { useUser } from "../../context/userContext";

interface Event {
  eventId: string;
  name: string;
  date: string;
  location: string;
}

const fetchEvents = async (): Promise<Event[]> => {
  const response = await fetch("/api/event");
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
};

export default function DashboardPage() {
  const { userFormat, isLoading: isUserLoading } = useUser();
  const { data: events = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isUserLoading || isEventsLoading) {
    return <Loading skeleton />;
  }

  const upcomingEvents = events.filter(
    (event) => new Date(event.date) >= new Date(),
  ).length;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {userFormat?.name || userFormat?.email || "User"}!
        </h1>
        <p className="text-gray-600">
          Here&apos; s a quick overview of what&apos;s happening with your
          events.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Total Events
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">
              {events.length}
            </h2>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
            <a href="/events" className="hover:underline">
              Manage events →
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Upcoming Events
            </span>
            <h2 className="text-4xl font-bold text-blue-600 mt-2">
              {upcomingEvents}
            </h2>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
            <a href="/events" className="hover:underline">
              View schedule →
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Account Type
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2 capitalize">
              {userFormat?.role || "User"}
            </h2>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
            <span>View profile →</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Start</h3>
        <p className="text-gray-600 mb-6">
          Ready to host something amazing? Start by creating a new event.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="/events/add"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors duration-200"
          >
            + Create New Event
          </a>
          <a
            href="/events"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors duration-200"
          >
            View All Events
          </a>
        </div>
      </div>
      <div className="md:container md mx:auto box-border">
        <h1>container</h1>
      </div>
    </div>
  );
}
