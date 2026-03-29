import { createAdminClient } from "@/lib/supabase/admin";
import { isValidTimeZone, toEventISO } from "@/lib/date-time";

const GAP_MS = 30 * 60 * 1000;
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export type BookingAvailabilityInput = {
  eventDate: string;
  eventTime?: string;
  eventEndTime?: string;
  timeZone: string;
};

export type BookingConflict = {
  title: string;
  time: string;
  type: "event" | "booking";
};

type AvailabilityResult =
  | { ok: true; available: boolean; conflicts: BookingConflict[]; hasTime: boolean }
  | { ok: false; error: string };

function getLocalDateStr(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatLocalTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export async function checkBookingAvailability(input: BookingAvailabilityInput): Promise<AvailabilityResult> {
  const { eventDate, eventTime, eventEndTime, timeZone } = input;

  if (!isValidTimeZone(timeZone)) {
    return { ok: false, error: "Invalid timezone" };
  }

  const dayStartISO = toEventISO(eventDate, timeZone, "00:00");
  const dayEndISO = toEventISO(eventDate, timeZone, "23:59");
  if (!dayStartISO || !dayEndISO) {
    return { ok: false, error: "Could not parse date" };
  }

  let propStartMs: number | null = null;
  let propEndMs: number | null = null;
  const hasTime = Boolean(eventTime?.trim());

  if (hasTime) {
    const startISO = toEventISO(eventDate, timeZone, eventTime!.trim());
    if (startISO) {
      propStartMs = new Date(startISO).getTime();
      if (eventEndTime?.trim()) {
        const endISO = toEventISO(eventDate, timeZone, eventEndTime.trim());
        propEndMs = endISO ? new Date(endISO).getTime() : propStartMs + DEFAULT_DURATION_MS;
      } else {
        propEndMs = propStartMs + DEFAULT_DURATION_MS;
      }
    }
  }

  try {
    const supabase = createAdminClient();

    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id, title, event_date")
      .gte("event_date", dayStartISO)
      .lte("event_date", dayEndISO);

    if (eventsErr) {
      console.error("[booking-availability] events query error:", eventsErr.message);
    }

    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id, event_name, event_date, event_end_time")
      .in("status", ["inquiry", "confirmed"])
      .gte("event_date", dayStartISO)
      .lte("event_date", dayEndISO);

    if (bookingsErr) {
      console.error("[booking-availability] bookings query error:", bookingsErr.message);
    }

    const conflicts: BookingConflict[] = [];

    const allItems = [
      ...(events ?? []).map((e) => ({
        title: e.title as string,
        start: e.event_date as string,
        end: null as string | null,
        type: "event" as const,
      })),
      ...(bookings ?? []).map((b) => ({
        title: b.event_name as string,
        start: b.event_date as string,
        end: b.event_end_time as string | null,
        type: "booking" as const,
      })),
    ];

    for (const item of allItems) {
      const itemStartDate = new Date(item.start);
      if (Number.isNaN(itemStartDate.getTime())) continue;

      if (getLocalDateStr(itemStartDate, timeZone) !== eventDate) continue;

      const timeLabel = formatLocalTime(itemStartDate, timeZone);
      const itemStartMs = itemStartDate.getTime();

      let itemEndMs: number;
      if (item.end) {
        const itemEndDate = new Date(item.end);
        itemEndMs = Number.isNaN(itemEndDate.getTime())
          ? itemStartMs + DEFAULT_DURATION_MS
          : itemEndDate.getTime();
      } else {
        itemEndMs = itemStartMs + DEFAULT_DURATION_MS;
      }

      if (!hasTime || propStartMs === null || propEndMs === null) {
        conflicts.push({ title: item.title, time: timeLabel, type: item.type });
        continue;
      }

      const gap = Math.max(0, Math.max(propStartMs - itemEndMs, itemStartMs - propEndMs));
      if (gap < GAP_MS) {
        conflicts.push({ title: item.title, time: timeLabel, type: item.type });
      }
    }

    return {
      ok: true,
      available: conflicts.length === 0,
      conflicts,
      hasTime,
    };
  } catch (error) {
    console.error("[booking-availability] unexpected error:", error);
    return { ok: false, error: "Could not check availability" };
  }
}
