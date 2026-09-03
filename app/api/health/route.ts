import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "weeon-management",
    time: new Date().toISOString(),
  });
}
