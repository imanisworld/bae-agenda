import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { toEventISO, isValidTimeZone } from "@/lib/date-time";

const CheckSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
  eventTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  timeZone: z.string().min(1),
});

const GAP_MS = 30 * 60 * 1000; // 30 minutes in ms
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // assume 2-hour event if no end time

function getLocalTimeParts(date: Date, timeZone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

function getLocalDateStr(date: Date, timeZone: string): string {
  // Returns "YYYY-MM-DD" in the given timezone
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

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = CheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { eventDate, eventTime, eventEndTime, timeZone } = parsed.data;

  if (!isValidTimeZone(timeZone)) {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  // Build the UTC range for this calendar date in the user's timezone
  const dayStartISO = toEventISO(eventDate, timeZone, "00:00");
  const dayEndISO = toEventISO(eventDate, timeZone, "23:59");
  if (!dayStartISO || !dayEndISO) {
    return NextResponse.json({ error: "Could not parse date" }, { status: 400 });
  }

  // Proposed window in UTC (ms)
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

    // Query events on this day (all, not just public — real gigs block the date)
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id, title, event_date")
      .gte("event_date", dayStartISO)
      .lte("event_date", dayEndISO);

    if (eventsErr) {
      console.error("[check-availability] events query error:", eventsErr.message);
    }

    // Query active bookings on this day
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id, event_name, event_date, event_end_time")
      .in("status", ["inquiry", "confirmed"])
      .gte("event_date", dayStartISO)
      .lte("event_date", dayEndISO);

    if (bookingsErr) {
      console.error("[check-availability] bookings query error:", bookingsErr.message);
    }

    type ConflictItem = { title: string; time: string; type: "event" | "booking" };
    const conflicts: ConflictItem[] = [];

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

      // Double-check it's actually on the same local date
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

      // If no proposed time — any same-day item is a heads-up
      if (!hasTime || propStartMs === null || propEndMs === null) {
        conflicts.push({ title: item.title, time: timeLabel, type: item.type });
        continue;
      }

      // Calculate gap between the two time windows
      // gap > 0 means they don't overlap; gap === 0 means they touch or overlap
      const gap = Math.max(0, Math.max(propStartMs - itemEndMs, itemStartMs - propEndMs));

      if (gap < GAP_MS) {
        conflicts.push({ title: item.title, time: timeLabel, type: item.type });
      }
    }

    return NextResponse.json({
      available: conflicts.length === 0,
      conflicts,
      hasTime,
    });
  } catch (err) {
    console.error("[check-availability] unexpected error:", err);
    return NextResponse.json({ error: "Could not check availability" }, { status: 500 });
  }
}
