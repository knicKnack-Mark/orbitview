import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
      {
        cache: "no-store",
        headers: {
          Accept: "text/plain",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to retrieve ISS orbital elements.",
          status: response.status,
        },
        { status: 502 }
      );
    }

    const tle = (await response.text()).trim();
    const lines = tle.split(/\r?\n/).map((line) => line.trim());

    if (
      lines.length < 3 ||
      !lines[1].startsWith("1 ") ||
      !lines[2].startsWith("2 ")
    ) {
      return NextResponse.json(
        { error: "The ISS TLE response has an unexpected format." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name: lines[0],
      line1: lines[1],
      line2: lines[2],
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ISS TLE fetch failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve ISS orbital elements." },
      { status: 500 }
    );
  }
}
