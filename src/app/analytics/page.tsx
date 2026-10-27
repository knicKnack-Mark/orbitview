
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  clearTelemetryHistory,
  downloadTelemetryCSV,
  readTelemetryHistory,
  type TelemetryRecord,
} from "@/lib/telemetry-history";
import LiveTelemetryCharts from "@/components/LiveTelemetryCharts";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function StatCard({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string;
  unit: string;
  detail: string;
}) {
  return (
    <article className="analytics-stat">
      <span className="analytics-stat-label">{label}</span>
      <div className="analytics-stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <span className="analytics-stat-detail">{detail}</span>
    </article>
  );
}

function TelemetryChart({
  title,
  subtitle,
  data,
  dataKey,
  color,
  unit,
}: {
  title: string;
  subtitle: string;
  data: Array<TelemetryRecord & { chartTime: string }>;
  dataKey: "altitude" | "velocity";
  color: string;
  unit: string;
}) {
  return (
    <section className="analytics-chart-card">
      <div className="analytics-chart-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span
          className="analytics-chart-indicator"
          style={{ background: color, boxShadow: `0 0 12px ${color}` }}
        />
      </div>

      <div className="analytics-chart">
        {data.length < 2 ? (
          <div className="analytics-chart-empty">
            <span className="analytics-empty-icon">⌁</span>
            <strong>Collecting telemetry</strong>
            <p>At least two recorded samples are needed for this chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 12, right: 14, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                stroke="rgba(126, 166, 190, 0.13)"
                strokeDasharray="4 5"
              />
              <XAxis
                dataKey="chartTime"
                tick={{ fill: "#7f98a9", fontSize: 10 }}
                axisLine={{ stroke: "#243b4c" }}
                tickLine={false}
                minTickGap={36}
              />
              <YAxis
                width={58}
                tick={{ fill: "#7f98a9", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => value.toFixed(0)}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0a1724",
                  border: "1px solid rgba(0, 242, 254, 0.25)",
                  borderRadius: 10,
                  color: "#edf8ff",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#8faaba" }}
                formatter={(value) => [
                  `${formatNumber(Number(value))} ${unit}`,
                  title,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#8faaba" }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                name={`${title} (${unit})`}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: "#eafcff" }}
                isAnimationActive={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [records, setRecords] = useState<TelemetryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [range, setRange] = useState<"1h" | "6h" | "24h" | "all">("6h");

  useEffect(() => {
    setRecords(readTelemetryHistory());
    setLoaded(true);
  }, []);

  const filteredRecords = useMemo(() => {
    if (range === "all" || records.length === 0) return records;

    const durationMs = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    }[range];

    const cutoff = Date.now() - durationMs;
    return records.filter((record) => record.timestamp >= cutoff);
  }, [records, range]);

  const chartData = useMemo(
    () =>
      filteredRecords.map((record) => ({
        ...record,
        chartTime: formatTime(record.timestamp),
      })),
    [filteredRecords],
  );

  const stats = useMemo(() => {
    const values = filteredRecords;

    if (!values.length) return null;

    const altitudes = values.map((record) => record.altitude);
    const velocities = values.map((record) => record.velocity);

    const average = (numbers: number[]) =>
      numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

    return {
      latestAltitude: altitudes[altitudes.length - 1],
      minAltitude: Math.min(...altitudes),
      maxAltitude: Math.max(...altitudes),
      averageAltitude: average(altitudes),
      latestVelocity: velocities[velocities.length - 1],
      minVelocity: Math.min(...velocities),
      maxVelocity: Math.max(...velocities),
      averageVelocity: average(velocities),
    };
  }, [filteredRecords]);

  function handleClearHistory() {
    const confirmed = window.confirm(
      "Delete all locally saved ISS telemetry? This cannot be undone.",
    );

    if (!confirmed) return;

    clearTelemetryHistory();
    setRecords([]);
  }

  return (
    <main className="analytics-page">
      <header className="analytics-topbar">
        <Link href="/" className="analytics-back-link">
          <span aria-hidden="true">←</span> Back to Mission Control
        </Link>
        <div className="analytics-system-label">
          <span className="analytics-system-dot" />
          ORBITVIEW / DATA SYSTEMS
        </div>
      </header>

      <div className="analytics-content">
        <section className="analytics-hero">
          <div>
            <div className="analytics-eyebrow">FLIGHT DATA INTELLIGENCE</div>
            <h1>Mission Analytics</h1>
            <p>
              Review recorded International Space Station telemetry,
              examine trends, and export measurements for further analysis.
            </p>
          </div>

          <div className="analytics-actions">
            <button
              type="button"
              className="analytics-button analytics-button-primary"
              disabled={!loaded || filteredRecords.length === 0}
              onClick={() => downloadTelemetryCSV(filteredRecords)}
            >
              <span aria-hidden="true">↓</span> Export CSV
            </button>
            <button
              type="button"
              className="analytics-button"
              disabled={!loaded || records.length === 0}
              onClick={handleClearHistory}
            >
              Clear history
            </button>
          </div>
        </section>

        <section className="analytics-toolbar">
          <div className="analytics-data-label">
            <span className="analytics-system-dot" />
            LOCAL TELEMETRY ARCHIVE
          </div>

          <div className="analytics-range-controls" aria-label="Time range">
            {(["1h", "6h", "24h", "all"] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={range === item ? "active" : ""}
                aria-pressed={range === item}
                onClick={() => setRange(item)}
              >
                {item === "all" ? "All time" : item}
              </button>
            ))}
          </div>
        </section>

        {!loaded ? (
          <div className="analytics-empty-state">
            Loading telemetry archive…
          </div>
        ) : (
          <>
            <section className="analytics-stat-grid">
              <StatCard
                label="RECORDED SAMPLES"
                value={filteredRecords.length.toLocaleString()}
                unit="pts"
                detail={`${records.length.toLocaleString()} total stored`}
              />
              <StatCard
                label="AVERAGE ALTITUDE"
                value={stats ? formatNumber(stats.averageAltitude, 1) : "—"}
                unit="km"
                detail={
                  stats
                    ? `Min ${formatNumber(stats.minAltitude, 1)} · Max ${formatNumber(stats.maxAltitude, 1)}`
                    : "No measurements yet"
                }
              />
              <StatCard
                label="AVERAGE VELOCITY"
                value={stats ? formatNumber(stats.averageVelocity, 1) : "—"}
                unit="km/h"
                detail={
                  stats
                    ? `Min ${formatNumber(stats.minVelocity, 1)} · Max ${formatNumber(stats.maxVelocity, 1)}`
                    : "No measurements yet"
                }
              />
              <StatCard
                label="LATEST SAMPLE"
                value={
                  filteredRecords.length
                    ? formatTime(
                        filteredRecords[filteredRecords.length - 1].timestamp,
                      )
                    : "—"
                }
                unit=""
                detail={
                  filteredRecords.length
                    ? new Date(
                        filteredRecords[filteredRecords.length - 1].timestamp,
                      ).toLocaleDateString()
                    : "Waiting for data"
                }
              />
            </section>

            {filteredRecords.length === 0 ? (
              <section className="analytics-empty-state">
                <div className="analytics-empty-icon">⌁</div>
                <h2>No telemetry in this time range</h2>
                <p>
                  Keep the main Mission Control page open while ISS data
                  is being collected, or choose a wider time range.
                  New records are saved locally by your dashboard.
                </p>
                <Link href="/" className="analytics-inline-link">
                  Open Mission Control →
                </Link>
              </section>
            ) : (
              <>
                <section className="analytics-charts-grid">
                  <TelemetryChart
                    title="Altitude"
                    subtitle="ISS altitude above Earth over time"
                    data={chartData}
                    dataKey="altitude"
                    color="#00f2fe"
                    unit="km"
                  />
                  <TelemetryChart
                    title="Velocity"
                    subtitle="ISS orbital speed over time"
                    data={chartData}
                    dataKey="velocity"
                    color="#a78bfa"
                    unit="km/h"
                  />
                </section>

                <section className="analytics-table-card">
                  <div className="analytics-table-heading">
                    <div>
                      <h2>Recent telemetry</h2>
                      <p>Latest 10 samples in the selected time range</p>
                    </div>
                    <span>{filteredRecords.length} SAMPLES</span>
                  </div>

                  <div className="analytics-table-scroll">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Timestamp (UTC)</th>
                          <th>Latitude</th>
                          <th>Longitude</th>
                          <th>Altitude (km)</th>
                          <th>Velocity (km/h)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...filteredRecords]
                          .reverse()
                          .slice(0, 10)
                          .map((record) => (
                            <tr key={record.timestamp}>
                              <td>
                                {new Date(record.timestamp).toLocaleString(
                                  undefined,
                                  {
                                    dateStyle: "short",
                                    timeStyle: "medium",
                                  },
                                )}
                              </td>
                              <td>{formatNumber(record.latitude, 4)}°</td>
                              <td>{formatNumber(record.longitude, 4)}°</td>
                              <td>{formatNumber(record.altitude, 2)}</td>
                              <td>{formatNumber(record.velocity, 2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            <LiveTelemetryCharts
              records={filteredRecords.map((record) => ({
                timestamp: record.timestamp,
                latitude: record.latitude,
                longitude: record.longitude,
                altitude: record.altitude,
              }))}
            />

            <footer className="analytics-footer">
              <span>ORBITVIEW TELEMETRY ARCHIVE</span>
              <span>
                Stored in this browser · Sampling follows the dashboard
                refresh interval
              </span>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
