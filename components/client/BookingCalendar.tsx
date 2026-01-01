"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BookingCalendarProps {
  orderId: string;
  coachId: string;
}

export function BookingCalendar({ orderId, coachId }: BookingCalendarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate next 14 days for simple MVP
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  // Simple time slots (9 AM - 5 PM, hourly)
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select both date and time");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          startsAt: appointmentDate.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to book appointment");
      }

      // Success - redirect to appointments page
      router.push("/client/appointments");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
      setLoading(false);
    }
  };

  const dates = getAvailableDates();

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-base text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="date" className="block text-base font-medium text-gray-900 mb-3">
          Select Date
        </label>
        <select
          id="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setSelectedTime(""); // Reset time when date changes
          }}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Choose a date...</option>
          {dates.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const displayStr = date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            });
            return (
              <option key={dateStr} value={dateStr}>
                {displayStr}
              </option>
            );
          })}
        </select>
      </div>

      {selectedDate && (
        <div>
          <label htmlFor="time" className="block text-base font-medium text-gray-900 mb-3">
            Select Time
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`px-4 py-3 text-base font-medium rounded-md border-2 transition-colors ${
                  selectedTime === time
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Times shown in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </p>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-base font-medium text-gray-900 mb-2">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any specific topics or questions you'd like to cover?"
        />
      </div>

      <div className="pt-4">
        <button
          onClick={handleBook}
          disabled={loading || !selectedDate || !selectedTime}
          className="w-full bg-blue-600 text-white px-6 py-4 text-base sm:text-lg rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </div>

      {selectedDate && selectedTime && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-base text-green-900 font-medium">
            📅 Your session will be scheduled for:
          </p>
          <p className="text-base text-green-800 mt-1">
            {new Date(`${selectedDate}T${selectedTime}`).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}
    </div>
  );
}
