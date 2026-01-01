"use client";

import { useState, useEffect } from "react";

interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  isRescheduled: boolean;
  zoomJoinUrl: string | null;
  zoomHostUrl: string | null;
  zoomPassword: string | null;
  notes: string | null;
  client: {
    name: string | null;
    email: string;
    phoneE164: string | null;
  };
  order: {
    product: {
      name: string;
    };
  };
}

interface CoachAppointmentListProps {
  coachId: string;
}

export function CoachAppointmentList({ coachId }: CoachAppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/coach/appointments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch appointments");
      }

      setAppointments(data.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatDateTime = (dateStr: string, timezone: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    });
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/cancel/${appointmentId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      fetchAppointments();
    } catch (err) {
      alert("Failed to cancel appointment");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Loading appointments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Yet</h3>
        <p className="text-gray-600">
          When clients book 1:1 sessions with you, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {appointment.order.product.name}
              </h3>

              <div className="space-y-2 text-sm sm:text-base text-gray-600">
                <p>
                  <span className="font-medium">Client:</span>{" "}
                  {appointment.client.name || appointment.client.email}
                </p>
                <p>
                  <span className="font-medium">Time:</span>{" "}
                  {formatDateTime(appointment.startsAt, appointment.timezone)}
                </p>
                {appointment.notes && (
                  <p>
                    <span className="font-medium">Notes:</span> {appointment.notes}
                  </p>
                )}
              </div>

              {appointment.zoomHostUrl && (
                <div className="mt-4">
                  <a
                    href={appointment.zoomHostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base font-medium"
                  >
                    Start Zoom Meeting (Host)
                  </a>
                  {appointment.zoomPassword && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Password: {appointment.zoomPassword}
                    </p>
                  )}
                </div>
              )}

              {!appointment.zoomHostUrl && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Zoom not configured - Meeting link unavailable
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === "scheduled"
                    ? appointment.isRescheduled
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                    : appointment.status === "canceled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {appointment.status === "scheduled" && appointment.isRescheduled
                  ? "rescheduled"
                  : appointment.status}
              </span>

              {appointment.status === "scheduled" && (
                <button
                  onClick={() => handleCancel(appointment.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
