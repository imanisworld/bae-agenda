import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { checkBookingAvailability } from "@/lib/booking-availability";
import { isValidTimeZone, toEventISO } from "@/lib/date-time";
import { limitBookingSubmission } from "@/lib/ratelimit";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "https://thebaeagenda.com",
  "https://www.thebaeagenda.com",
]);

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
  // Honeypot / meta
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

type BookingData = z.infer<typeof BookingSchema>;

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL ?? process.env.BOOKING_FROM_EMAIL;
  const alertEmail = process.env.ALERT_EMAIL ?? process.env.BOOKING_ALERT_EMAIL;
  if (!apiKey || !fromEmail || !alertEmail) return null;
  if (!fromEmail.includes("@") || !alertEmail.includes("@")) return null;
  return { apiKey, fromEmail, alertEmail };
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber = process.env.BOOKING_SMS_TO;
  if (!accountSid || !authToken || !fromNumber || !toNumber) return null;
  return { accountSid, authToken, fromNumber, toNumber };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildOwnerEmail(data: BookingData): string {
  const name = escapeHtml([data.firstName, data.lastName].filter(Boolean).join(" "));
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone || "—");
  const eventName = escapeHtml(data.eventName);
  const eventType = escapeHtml(data.eventType || "—");
  const eventDate = escapeHtml(data.eventDate);
  const timeRange = escapeHtml(
    data.eventTime
      ? data.eventEndTime ? `${data.eventTime} – ${data.eventEndTime}` : data.eventTime
      : "—"
  );
  const timeZone = escapeHtml(data.timeZone || "—");
  const venue = escapeHtml(data.venue || "—");
  const city = escapeHtml(data.city || "—");
  const packageName = escapeHtml(data.package || "—");
  const notes = data.notes ? escapeHtml(data.notes) : null;

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>🎧 New Booking Request</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${name}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${email}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${phone}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Event Name</td><td style="padding:8px">${eventName}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Event Type</td><td style="padding:8px">${eventType}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${eventDate}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Time</td><td style="padding:8px">${timeRange}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Timezone</td><td style="padding:8px">${timeZone}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Venue</td><td style="padding:8px">${venue}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">City</td><td style="padding:8px">${city}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Package</td><td style="padding:8px">${packageName}</td></tr>
      ${notes ? `<tr><td style="padding:8px;font-weight:bold">Notes</td><td style="padding:8px">${notes}</td></tr>` : ""}
    </table>
  </div>`;
}

function buildClientEmail(data: BookingData): string {
  const firstName = escapeHtml(data.firstName);
  const eventName = escapeHtml(data.eventName);
  const eventType = data.eventType ? escapeHtml(data.eventType) : null;
  const eventDate = escapeHtml(data.eventDate);
  const timeRange = data.eventTime
    ? escapeHtml(data.eventEndTime ? `${data.eventTime} – ${data.eventEndTime}` : data.eventTime)
    : null;
  const venue = data.venue ? escapeHtml(data.venue) : null;
  const city = data.city ? escapeHtml(data.city) : null;

  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>Thanks for reaching out, ${firstName}!</h2>
    <p>Your booking request has been received. Here's a summary:</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;font-weight:bold">Event</td><td style="padding:8px">${eventName}</td></tr>
      ${eventType ? `<tr><td style="padding:8px;font-weight:bold">Type</td><td style="padding:8px">${eventType}</td></tr>` : ""}
      <tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${eventDate}</td></tr>
      ${timeRange ? `<tr><td style="padding:8px;font-weight:bold">Time</td><td style="padding:8px">${timeRange}</td></tr>` : ""}
      ${venue ? `<tr><td style="padding:8px;font-weight:bold">Venue</td><td style="padding:8px">${venue}</td></tr>` : ""}
      ${city ? `<tr><td style="padding:8px;font-weight:bold">City</td><td style="padding:8px">${city}</td></tr>` : ""}
    </table>
    <p style="margin-top:24px">I'll be in touch within 24–48 hours to confirm availability and discuss details.</p>
    <p>— Bae Agenda</p>
  </div>`;
}

async function sendSMS(config: NonNullable<ReturnType<typeof getTwilioConfig>>, data: BookingData) {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const body = `New booking: ${name} | ${data.eventType || data.eventName} | ${data.eventDate} | ${data.email}`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: config.fromNumber, To: config.toNumber, Body: body }),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}`);
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
  const contentType = req.headers.get("content-type") ?? "";

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
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
    // Return the specific field errors so the form can highlight them
    const fields = Object.keys(flat.fieldErrors);
    const firstMessage = Object.values(flat.fieldErrors).flat()[0] ?? "Please review your submission.";
    return NextResponse.json(
      { error: firstMessage, fields },
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

    return NextResponse.json(
      {
        error: "That date or time is no longer available. Please choose another slot.",
        fields,
        conflicts: availability.conflicts,
      },
      { status: 409 }
    );
  }

  const resendConfig = getResendConfig();
  if (!resendConfig) {
    console.error("[booking] FATAL: missing RESEND_API_KEY, FROM_EMAIL/BOOKING_FROM_EMAIL, or ALERT_EMAIL/BOOKING_ALERT_EMAIL");
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  const twilioConfig = getTwilioConfig();

  const resend = new Resend(resendConfig.apiKey);

  // Both emails required — thebaeagenda.com is verified in Resend
  try {
    await resend.emails.send({
      from: resendConfig.fromEmail,
      to: resendConfig.alertEmail,
      subject: `New Booking: ${data.eventName} (${data.eventType || "General"}) — ${data.eventDate}`,
      html: buildOwnerEmail(data),
    });

    await resend.emails.send({
      from: resendConfig.fromEmail,
      to: data.email,
      subject: "Booking Request Received — Bae Agenda",
      html: buildClientEmail(data),
    });
  } catch (err) {
    console.error("[booking] Resend error:", err);
    return NextResponse.json({ error: "Failed to send confirmation email. Please try again." }, { status: 500 });
  }

  if (twilioConfig) {
    try {
      await sendSMS(twilioConfig, data);
    } catch (err) {
      console.error("[booking] Twilio failed (non-fatal):", err);
    }
  }

  return NextResponse.json(
    { success: true, message: "Booking request received! You'll hear back within 24–48 hours." },
    { status: 201 }
  );
}
