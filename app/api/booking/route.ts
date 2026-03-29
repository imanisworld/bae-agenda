import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
});

// ─── Validation Schema ────────────────────────────────────────────────────────
const BookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional(),
  venue: z.string().optional(),
  guestCount: z.string().optional(),
  duration: z.string().optional(),
  budget: z.string().optional(),
  additionalInfo: z.string().optional(),
});

type BookingData = z.infer<typeof BookingSchema>;

// ─── Config Validators ────────────────────────────────────────────────────────
function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.BOOKING_FROM_EMAIL;
  const alertEmail = process.env.BOOKING_ALERT_EMAIL;

  if (!apiKey || !fromEmail || !alertEmail) {
    return null;
  }
  if (!fromEmail.includes("@") || !alertEmail.includes("@")) {
    return null;
  }
  return { apiKey, fromEmail, alertEmail };
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber = process.env.BOOKING_SMS_TO;

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    return null; // optional — not an error
  }
  return { accountSid, authToken, fromNumber, toNumber };
}

// ─── Email Templates ──────────────────────────────────────────────────────────
function buildOwnerEmail(data: BookingData): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">🎧 New Booking Request</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${data.name}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${data.email}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;">${data.phone || "—"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Event Type</td><td style="padding: 8px;">${data.eventType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Event Date</td><td style="padding: 8px;">${data.eventDate}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Event Time</td><td style="padding: 8px;">${data.eventTime || "—"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Venue</td><td style="padding: 8px;">${data.venue || "—"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Guest Count</td><td style="padding: 8px;">${data.guestCount || "—"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Duration</td><td style="padding: 8px;">${data.duration || "—"}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Budget</td><td style="padding: 8px;">${data.budget || "—"}</td></tr>
        ${data.additionalInfo ? `<tr><td style="padding: 8px; font-weight: bold;">Notes</td><td style="padding: 8px;">${data.additionalInfo}</td></tr>` : ""}
      </table>
    </div>
  `;
}

function buildClientEmail(data: BookingData): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Thanks for reaching out, ${data.name}!</h2>
      <p>Your booking request has been received. Here's a summary:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; font-weight: bold;">Event Type</td><td style="padding: 8px;">${data.eventType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${data.eventDate}</td></tr>
        ${data.venue ? `<tr><td style="padding: 8px; font-weight: bold;">Venue</td><td style="padding: 8px;">${data.venue}</td></tr>` : ""}
      </table>
      <p style="margin-top: 24px;">I'll be in touch within 24–48 hours to confirm availability and discuss details.</p>
      <p>— Bae Agenda</p>
    </div>
  `;
}

// ─── SMS Sender (optional) ────────────────────────────────────────────────────
async function sendSMS(
  config: NonNullable<ReturnType<typeof getTwilioConfig>>,
  data: BookingData
): Promise<void> {
  const body = `New booking: ${data.name} | ${data.eventType} | ${data.eventDate} | ${data.email}`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: config.fromNumber,
        To: config.toNumber,
        Body: body,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Twilio error ${response.status}: ${err}`);
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log("[booking] request received");

  // ── Rate limiting ──
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { success: rateLimitPassed } = await ratelimit.limit(ip);
  if (!rateLimitPassed) {
    console.log("[booking] rate limit exceeded");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // ── Parse body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.log("[booking] invalid JSON body");
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // ── Validate with Zod ──
  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    console.log("[booking] validation failed", parsed.error.flatten());
    return NextResponse.json(
      { error: "Invalid booking data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  console.log("[booking] validation passed");
  const data = parsed.data;

  // ── Check Resend config — REQUIRED ──
  const resendConfig = getResendConfig();
  if (!resendConfig) {
    console.error(
      "[booking] FATAL: Resend config missing. " +
      "Set RESEND_API_KEY, BOOKING_FROM_EMAIL, and BOOKING_ALERT_EMAIL in Vercel env vars."
    );
    return NextResponse.json(
      { error: "Email service not configured. Contact the site owner." },
      { status: 500 }
    );
  }

  // ── Check Twilio config — OPTIONAL ──
  const twilioConfig = getTwilioConfig();
  if (!twilioConfig) {
    console.log("[booking] twilio skipped (not configured)");
  }

  // ── Send emails via Resend ──
  const resend = new Resend(resendConfig.apiKey);

  try {
    // Notify owner
    await resend.emails.send({
      from: resendConfig.fromEmail,
      to: resendConfig.alertEmail,
      subject: `New Booking Request: ${data.eventType} — ${data.eventDate}`,
      html: buildOwnerEmail(data),
    });

    // Confirm to client
    await resend.emails.send({
      from: resendConfig.fromEmail,
      to: data.email,
      subject: "Booking Request Received — Bae Agenda",
      html: buildClientEmail(data),
    });

    console.log("[booking] email sent via Resend");
  } catch (err) {
    console.error("[booking] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send confirmation email. Please try again." },
      { status: 500 }
    );
  }

  // ── Send SMS via Twilio — optional, never blocks booking ──
  if (twilioConfig) {
    try {
      await sendSMS(twilioConfig, data);
      console.log("[booking] SMS sent via Twilio");
    } catch (err) {
      // Log but don't fail — SMS is non-critical
      console.error("[booking] Twilio SMS failed (non-fatal):", err);
    }
  }

  console.log("[booking] complete — booking confirmed for", data.email);

  return NextResponse.json(
    {
      success: true,
      message: "Booking request received! You'll hear back within 24–48 hours.",
    },
    { status: 201 }
  );
}
