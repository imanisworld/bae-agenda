import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
});

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
  timeZone:     z.string().optional(),
  // Location
  venue:        z.string().optional(),
  city:         z.string().optional(),
  // Details
  package:      z.string().optional(),
  notes:        z.string().optional(),
  // Honeypot / meta
  website:      z.string().optional(),
  startedAt:    z.string().optional(),
});

type BookingData = z.infer<typeof BookingSchema>;

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BOOKING_FROM_EMAIL;
  const alertEmail = process.env.BOOKING_ALERT_EMAIL;
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

function buildOwnerEmail(data: BookingData): string {
  const name = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const timeRange = data.eventTime
    ? data.eventEndTime ? `${data.eventTime} – ${data.eventEndTime}` : data.eventTime
    : "—";
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>🎧 New Booking Request</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">${name}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${data.email}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${data.phone || "—"}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Event Name</td><td style="padding:8px">${data.eventName}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Event Type</td><td style="padding:8px">${data.eventType || "—"}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${data.eventDate}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Time</td><td style="padding:8px">${timeRange}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Timezone</td><td style="padding:8px">${data.timeZone || "—"}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Venue</td><td style="padding:8px">${data.venue || "—"}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">City</td><td style="padding:8px">${data.city || "—"}</td></tr>
      <tr><td style="padding:8px;font-weight:bold">Package</td><td style="padding:8px">${data.package || "—"}</td></tr>
      ${data.notes ? `<tr><td style="padding:8px;font-weight:bold">Notes</td><td style="padding:8px">${data.notes}</td></tr>` : ""}
    </table>
  </div>`;
}

function buildClientEmail(data: BookingData): string {
  const timeRange = data.eventTime
    ? data.eventEndTime ? `${data.eventTime} – ${data.eventEndTime}` : data.eventTime
    : null;
  return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2>Thanks for reaching out, ${data.firstName}!</h2>
    <p>Your booking request has been received. Here's a summary:</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px;font-weight:bold">Event</td><td style="padding:8px">${data.eventName}</td></tr>
      ${data.eventType ? `<tr><td style="padding:8px;font-weight:bold">Type</td><td style="padding:8px">${data.eventType}</td></tr>` : ""}
      <tr><td style="padding:8px;font-weight:bold">Date</td><td style="padding:8px">${data.eventDate}</td></tr>
      ${timeRange ? `<tr><td style="padding:8px;font-weight:bold">Time</td><td style="padding:8px">${timeRange}</td></tr>` : ""}
      ${data.venue ? `<tr><td style="padding:8px;font-weight:bold">Venue</td><td style="padding:8px">${data.venue}</td></tr>` : ""}
      ${data.city ? `<tr><td style="padding:8px;font-weight:bold">City</td><td style="padding:8px">${data.city}</td></tr>` : ""}
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
  console.log("[booking] request received");

  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    console.log("[booking] rate limit exceeded");
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    console.log("[booking] validation failed", flat);
    // Return the specific field errors so the form can highlight them
    const fields = Object.keys(flat.fieldErrors);
    const firstMessage = Object.values(flat.fieldErrors).flat()[0] ?? "Please review your submission.";
    return NextResponse.json(
      { error: firstMessage, fields },
      { status: 400 }
    );
  }

  console.log("[booking] validation passed");
  const data = parsed.data;

  // Honeypot — bot filled the hidden website field
  if (data.website) {
    console.log("[booking] honeypot triggered");
    return NextResponse.json({ success: true, message: "Request received." }, { status: 201 });
  }

  const resendConfig = getResendConfig();
  if (!resendConfig) {
    console.error("[booking] FATAL: missing RESEND_API_KEY, BOOKING_FROM_EMAIL, or BOOKING_ALERT_EMAIL");
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  const twilioConfig = getTwilioConfig();
  if (!twilioConfig) console.log("[booking] twilio skipped (not configured)");

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

    console.log("[booking] emails sent via Resend");
  } catch (err) {
    console.error("[booking] Resend error:", err);
    return NextResponse.json({ error: "Failed to send confirmation email. Please try again." }, { status: 500 });
  }

  if (twilioConfig) {
    try {
      await sendSMS(twilioConfig, data);
      console.log("[booking] SMS sent via Twilio");
    } catch (err) {
      console.error("[booking] Twilio failed (non-fatal):", err);
    }
  }

  console.log("[booking] complete —", data.email);
  return NextResponse.json(
    { success: true, message: "Booking request received! You'll hear back within 24–48 hours." },
    { status: 201 }
  );
}
