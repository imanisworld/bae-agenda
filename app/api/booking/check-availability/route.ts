import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkBookingAvailability } from "@/lib/booking-availability";
import { limitAvailabilityCheck } from "@/lib/ratelimit";

const CheckSchema = z.object({
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (use YYYY-MM-DD)"),
  eventTime: z.string().optional(),
  eventEndTime: z.string().optional(),
  timeZone: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const rateLimit = await limitAvailabilityCheck(req.headers);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Too many availability checks. Please wait a moment and try again.",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

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
  const result = await checkBookingAvailability({ eventDate, eventTime, eventEndTime, timeZone });

  if (!result.ok) {
    const status = result.error === "Invalid timezone" || result.error === "Could not parse date" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
