export type TelemetryRecord = {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
};

const STORAGE_KEY = "orbitview:iss-telemetry:v1";
const MAX_RECORDS = 20_000;

function isTelemetryRecord(value: unknown): value is TelemetryRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

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

export function readTelemetryHistory(): TelemetryRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isTelemetryRecord)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveTelemetryRecord(
  record: TelemetryRecord
): void {
  if (typeof window === "undefined" || !isTelemetryRecord(record)) {
    return;
  }

  try {
    const history = readTelemetryHistory();
    const lastRecord = history[history.length - 1];

    // Avoid saving the same API timestamp repeatedly.
    if (lastRecord?.timestamp === record.timestamp) {
      return;
    }

    history.push(record);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_RECORDS))
    );
  } catch (error) {
    console.error("Unable to save ISS telemetry history:", error);
  }
}

export function clearTelemetryHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Unable to clear ISS telemetry history:", error);
  }
}

export function downloadTelemetryCSV(
  records: TelemetryRecord[]
): void {
  if (typeof window === "undefined" || records.length === 0) {
    return;
  }

  const headers = [
    "timestamp",
    "date_utc",
    "latitude",
    "longitude",
    "altitude_km",
    "velocity_kmh",
  ];

  const escapeCSV = (value: string | number): string => {
    const text = String(value);

    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const rows = records.map((record) => [
    record.timestamp,
    new Date(record.timestamp).toISOString(),
    record.latitude,
    record.longitude,
    record.altitude,
    record.velocity,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob([csv], {
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
