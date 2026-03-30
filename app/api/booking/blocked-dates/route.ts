import { NextRequest, NextResponse } from "next/server";
import { getBlockedBookingDates } from "@/lib/booking-availability";

export async function GET(req: NextRequest) {
  const timeZone = req.nextUrl.searchParams.get("timeZone") ?? "America/Indiana/Indianapolis";
  const result = await getBlockedBookingDates(timeZone);

  if (!result.ok) {
    const status = result.error === "Invalid timezone" ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
