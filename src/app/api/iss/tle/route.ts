import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET() {
  try {
    const url = "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle";
    const response = await fetch(url, {
      next: { revalidate: 600 },
      headers: { "User-Agent": "OrbitView/1.0 (educational ISS pass estimator)" },
    });
    if (!response.ok) {
      return NextResponse.json({ error: "The orbital-elements provider is temporarily unavailable." }, { status: 502 });
    }
    const text = (await response.text()).trim();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const line1 = lines.find((line) => line.startsWith("1 "));
    const line2 = lines.find((line) => line.startsWith("2 "));
    if (!line1 || !line2) {
      return NextResponse.json({ error: "The provider returned an invalid TLE response." }, { status: 502 });
    }
    return NextResponse.json({ name: lines.find((line) => !line.startsWith("1 ") && !line.startsWith("2 ")) ?? "ISS (ZARYA)", line1, line2, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ error: "Unable to retrieve current orbital elements." }, { status: 502 });
  }
}
