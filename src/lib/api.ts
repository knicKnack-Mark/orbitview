
export type TelemetryRecord = {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
};

const STORAGE_KEY = "orbitview:iss-telemetry:v1";
const MAX_RECORDS = 20_000;

export function readTelemetryHistory(): TelemetryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTelemetryRecord).slice(-MAX_RECORDS);
  } catch {
    return [];
  }
}

function isTelemetryRecord(value: unknown): value is TelemetryRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.timestamp === "number" &&
    Number.isFinite(record.timestamp) &&
    typeof record.latitude === "number" &&
    Number.isFinite(record.latitude) &&
    typeof record.longitude === "number" &&
    Number.isFinite(record.longitude) &&
    typeof record.altitude === "number" &&
    Number.isFinite(record.altitude) &&
    typeof record.velocity === "number" &&
    Number.isFinite(record.velocity)
  );
}

export function saveTelemetryRecord(record: TelemetryRecord): void {
  if (typeof window === "undefined" || !isTelemetryRecord(record)) return;

  try {
    const history = readTelemetryHistory();
    const last = history[history.length - 1];

    // Avoid recording the same API timestamp twice.
    if (last && last.timestamp === record.timestamp) return;

    history.push(record);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_RECORDS)),
    );
  } catch (error) {
    console.error("Unable to save OrbitView telemetry history.", error);
  }
}

export function clearTelemetryHistory(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function downloadTelemetryCSV(records: TelemetryRecord[]): void {
  if (typeof window === "undefined" || records.length === 0) return;

  const headers = [
    "timestamp_utc",
    "latitude_deg",
    "longitude_deg",
    "altitude_km",
    "velocity_kmh",
  ];

  const rows = records.map((record) => [
    new Date(record.timestamp).toISOString(),
    record.latitude,
    record.longitude,
    record.altitude,
    record.velocity,
  ]);

  const escapeCSV = (value: string | number) => {
    const text = String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `orbitview-iss-telemetry-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
