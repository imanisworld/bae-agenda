import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkBookingAvailability } from "@/lib/booking-availability";
import { isValidTimeZone, toEventISO } from "@/lib/date-time";
import { limitBookingSubmission } from "@/lib/ratelimit";
import { sendBookingNotifications } from "@/lib/notifications";
import { stampBookingEmailSentAt } from "@/lib/booking-email-tracking";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError, logEvent } from "@/lib/monitoring";

const ALLOWED_ORIGINS = new Set([
  "https://thebaeagenda.com",
  "https://www.thebaeagenda.com",
]);

function isAllowedOrigin(origin: string, requestHost: string) {
  if (!origin) return true;

  if (ALLOWED_ORIGINS.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      return true;
    }

    return Boolean(requestHost) && url.host === requestHost;
  } catch {
    return false;
  }
}

const BookingSchema = z.object({
  // Contact
  firstName:    z.string().min(1, "First name is required"),
  lastName:     z.string().optional(),
  email:        z.string().email("Invalid email address"),
  phone:        z.string().optional(),
  // Event
  eventName:    z.string().min(1, "Event name is required"),
  eventType:    z.string().optional(),
  eventDate:    z.string().min(1, "Event date is required"),
  eventTime:    z.string().optional(),
  eventEndTime: z.string().optional(),
  timeZone:     z.string().min(1, "Timezone is required"),
  // Location
  venue:        z.string().optional(),
  city:         z.string().optional(),
  // Details
  package:      z.string().optional(),
  notes:        z.string().optional(),
  // Consent / honeypot / meta
  acceptedTerms: z.literal(true, {
    message: "Booking Terms must be accepted.",
  }),
  website:      z.string().optional(),
  startedAt:    z.string().optional(),
}).superRefine((data, ctx) => {
  if (!isValidTimeZone(data.timeZone)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["timeZone"],
      message: "Invalid timezone.",
    });
    return;
  }

  const eventDateIso = toEventISO(data.eventDate, data.timeZone, "00:00");
  if (!eventDateIso) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eventDate"],
      message: "Invalid event date.",
    });
  }

  const hasStartTime = Boolean(data.eventTime?.trim());
  const hasEndTime = Boolean(data.eventEndTime?.trim());

  let startMs: number | null = null;
  if (hasStartTime) {
    const startIso = toEventISO(data.eventDate, data.timeZone, data.eventTime!.trim());
    if (!startIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventTime"],
        message: 'Invalid format. Use "10:00 AM" or "22:00".',
      });
    } else {
      startMs = new Date(startIso).getTime();
    }
  }

  if (hasEndTime) {
    const endIso = toEventISO(data.eventDate, data.timeZone, data.eventEndTime!.trim());
    if (!endIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventEndTime"],
        message: 'Invalid format. Use "11:30 PM" or "23:30".',
      });
      return;
    }

    if (startMs !== null && new Date(endIso).getTime() <= startMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventEndTime"],
        message: "End time must be after start time.",
      });
    }
  }
});

function optionalString(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function bookingSubmissionKey(data: {
  email: string;
  eventName: string;
  eventDate: string;
  startedAt?: string;
}) {
  const startedAt = data.startedAt?.trim();
  if (!startedAt) return null;

  return createHash("sha256")
    .update([
      data.email.trim().toLowerCase(),
      data.eventName.trim().toLowerCase(),
      data.eventDate.trim(),
      startedAt,
    ].join("|"))
    .digest("hex");
}

function flattenFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([field, messages]) => {
      const message = messages?.[0];
      return message ? [[field, message]] : [];
    })
  );
}

export async function POST(req: NextRequest) {
  const rateLimit = await limitBookingSubmission(req.headers);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: "Too many requests.",
        retryAfter: rateLimit.retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      }
    );
  }

  const origin = req.headers.get("origin") ?? "";
  const requestHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const contentType = req.headers.get("content-type") ?? "";

  if (!isAllowedOrigin(origin, requestHost)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fields = Object.keys(flat.fieldErrors);
    const firstMessage = Object.values(flat.fieldErrors).flat()[0] ?? "Please review your submission.";
    const fieldErrors = flattenFieldErrors(flat.fieldErrors);
    return NextResponse.json(
      { error: firstMessage, fields, fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot — bot filled the hidden website field
  if (data.website) {
    return NextResponse.json({ success: true, message: "Request received." }, { status: 201 });
  }

  const availability = await checkBookingAvailability({
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    eventEndTime: data.eventEndTime,
    timeZone: data.timeZone,
  });

  if (!availability.ok) {
    const status = availability.error === "Invalid timezone" || availability.error === "Could not parse date" ? 400 : 500;
    return NextResponse.json({ error: availability.error }, { status });
  }

  if (!availability.available) {
    const fields = data.eventTime?.trim() || data.eventEndTime?.trim()
      ? ["eventDate", "eventTime", "eventEndTime"]
      : ["eventDate"];
    const fieldErrors = data.eventTime?.trim() || data.eventEndTime?.trim()
      ? {
          eventDate: "That date or time is no longer available.",
          eventTime: "Choose a different time with at least a 30-minute gap.",
          eventEndTime: "Review the event window and choose another slot.",
        }
      : {
          eventDate: "This date is already booked. Please choose another date.",
        };

    return NextResponse.json(
      {
        error: "That date or time is no longer available. Please choose another slot.",
        fields,
        fieldErrors,
        conflicts: availability.conflicts,
      },
      { status: 409 }
    );
  }

  const eventDateIso = toEventISO(data.eventDate, data.timeZone, data.eventTime?.trim() || "00:00");
  if (!eventDateIso) {
    return NextResponse.json({ error: "Invalid event date." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    const clientPayload = {
      first_name: data.firstName.trim(),
      last_name: optionalString(data.lastName),
      email: data.email.trim().toLowerCase(),
      phone: optionalString(data.phone),
      notes: optionalString(data.notes),
    };

    const { data: client, error: clientError } = await admin
      .from("clients")
      .upsert(clientPayload, { onConflict: "email" })
      .select("id")
      .single();

    if (clientError || !client?.id) {
      logEvent("error", "Booking client upsert failed", {
        operation: "booking_client_upsert",
        errorCode: clientError?.code,
        errorMessage: clientError?.message,
      });
      return NextResponse.json({ error: "Unable to save your contact details. Please try again." }, { status: 500 });
    }

    const eventEndTime = data.eventEndTime?.trim()
      ? toEventISO(data.eventDate, data.timeZone, data.eventEndTime.trim())
      : null;

    const submissionKey = bookingSubmissionKey(data);

    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        client_id: client.id,
        event_name: data.eventName.trim(),
        event_type: optionalString(data.eventType),
        event_date: eventDateIso,
        event_timezone: data.timeZone.trim(),
        event_end_time: eventEndTime,
        venue: optionalString(data.venue),
        city: optionalString(data.city),
        package: optionalString(data.package),
        notes: optionalString(data.notes),
        status: "inquiry",
        terms_accepted_at: new Date().toISOString(),
        terms_version: "2026-09-28",
        submission_key: submissionKey,
      })
      .select("id")
      .single();

    if (bookingError || !booking?.id) {
      if (bookingError?.code === "23505" && submissionKey) {
        const { data: existing } = await admin
          .from("bookings")
          .select("id")
          .eq("submission_key", submissionKey)
          .maybeSingle();

        if (existing?.id) {
          return NextResponse.json(
            { success: true, message: "Booking request received! You'll hear back within 24–48 hours." },
            { status: 200 }
          );
        }
      }

      logEvent("error", "Booking insert failed", {
        operation: "booking_insert",
        errorCode: bookingError?.code,
        errorMessage: bookingError?.message,
        hasSubmissionKey: Boolean(submissionKey),
      });
      return NextResponse.json({ error: "Unable to save your booking request. Please try again." }, { status: 500 });
    }

    const notificationSummary = await sendBookingNotifications({
      firstName: clientPayload.first_name,
      lastName: clientPayload.last_name,
      email: clientPayload.email,
      phone: clientPayload.phone,
      eventName: data.eventName.trim(),
      eventType: optionalString(data.eventType),
      eventDate: eventDateIso,
      eventTimeZone: data.timeZone.trim(),
      venue: optionalString(data.venue),
      city: optionalString(data.city),
      packageName: optionalString(data.package),
      notes: optionalString(data.notes),
    });

    if (notificationSummary.clientReceiptSent) {
      await stampBookingEmailSentAt(admin, booking.id, "inquiry_receipt_sent_at");
    }
  } catch (error) {
    logError("Booking request save failed", error, {
      operation: "booking_save",
    });
    return NextResponse.json({ error: "Unable to process your booking request. Please try again." }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, message: "Booking request received! You'll hear back within 24–48 hours." },
    { status: 201 }
  );
}
