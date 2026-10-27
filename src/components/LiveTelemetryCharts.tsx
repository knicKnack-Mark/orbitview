"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartTelemetryRecord = {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
};

type LiveTelemetryChartsProps = {
  records: ChartTelemetryRecord[];
};

export default function LiveTelemetryCharts({
  records,
}: LiveTelemetryChartsProps) {
  const data = records
    .filter(
      (record) =>
        Number.isFinite(record.timestamp) &&
        Number.isFinite(record.altitude) &&
        Number.isFinite(record.latitude) &&
        Number.isFinite(record.longitude),
    )
    .slice(-100)
    .map((record) => ({
      ...record,
      time: new Date(record.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    }));

  const charts = [
    {
      title: "Altitude History",
      key: "altitude" as const,
      unit: " km",
    },
    {
      title: "Latitude History",
      key: "latitude" as const,
      unit: "°",
    },
    {
      title: "Longitude History",
      key: "longitude" as const,
      unit: "°",
    },
  ];

  return (
    <section className="telemetry-charts">
      <header className="telemetry-charts-header">
        <div>
          <p className="orbit-eyebrow">FLIGHT DATA</p>
          <h2>Telemetry Trends</h2>
        </div>
        <span>{data.length} samples</span>
      </header>

      {charts.map((chart) => (
        <article className="telemetry-chart-card" key={chart.key}>
          <h3>{chart.title}</h3>

          <div className="telemetry-chart">
            {data.length < 2 ? (
              <p className="telemetry-chart-empty">
                Collect at least two readings to display a trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid
                    stroke="rgba(130, 170, 210, 0.13)"
                    strokeDasharray="3 5"
                  />

                  <XAxis
                    dataKey="time"
                    minTickGap={35}
                    tick={{ fill: "#829bb5", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    width={52}
                    tick={{ fill: "#829bb5", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={["auto", "auto"]}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#0b1728",
                      border: "1px solid rgba(92,176,255,.3)",
                      borderRadius: 8,
                      color: "#e8f3ff",
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(3)}${chart.unit}`,
                      chart.title,
                    ]}
                    labelStyle={{ color: "#9ab5cf" }}
                  />

                  <Line
                    type="monotone"
                    dataKey={chart.key}
                    stroke="#48d9ff"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ffffff" }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
