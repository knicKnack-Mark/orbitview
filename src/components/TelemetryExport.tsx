"use client";

import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import type { TelemetryRecord } from "@/lib/telemetry-history";

type Props = { records: TelemetryRecord[] };

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function TelemetryExport({ records }: Props) {
  const validRecords = records.filter((record) =>
    [record.timestamp, record.latitude, record.longitude, record.altitude, record.velocity].every(Number.isFinite),
  );

  function exportJson() {
    downloadFile(
      `orbitview-iss-telemetry-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), source: "OrbitView local browser history", count: validRecords.length, records: validRecords }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  function exportCsv() {
    const header = ["timestamp_iso", "timestamp_ms", "latitude_deg", "longitude_deg", "altitude_km", "velocity_kmh"];
    const rows = validRecords.map((r) => [new Date(r.timestamp).toISOString(), r.timestamp, r.latitude, r.longitude, r.altitude, r.velocity]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    downloadFile(`orbitview-iss-telemetry-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  }

  return (
    <section className="orbit-panel ov-export-panel" aria-labelledby="ov-export-title">
      <div className="panel-heading">
        <div>
          <h2 id="ov-export-title"><Download size={19} /> Export Telemetry</h2>
          <p>Download the samples stored in this browser. Nothing is uploaded.</p>
        </div>
        <span className="live-tag">{validRecords.length.toLocaleString()} SAMPLES</span>
      </div>
      <div className="ov-export-actions">
        <button type="button" className="ov-action-button" onClick={exportCsv} disabled={!validRecords.length}>
          <FileSpreadsheet size={16} /> Export CSV
        </button>
        <button type="button" className="ov-action-button" onClick={exportJson} disabled={!validRecords.length}>
          <FileJson size={16} /> Export JSON
        </button>
      </div>
      {!validRecords.length && <p className="ov-muted">No valid telemetry samples are available to export yet.</p>}
    </section>
  );
}
