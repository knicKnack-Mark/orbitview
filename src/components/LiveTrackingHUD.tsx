
"use client";

type ISSData = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp?: number;
};

type LiveTrackingHUDProps = {
  iss: ISSData | null;
  connected: boolean;
  lastUpdated: number | null;
};

function formatNumber(value: number | undefined, digits = 2) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(digits)
    : "--";
}

export default function LiveTrackingHUD({
  iss,
  connected,
  lastUpdated,
}: LiveTrackingHUDProps) {
  const updatedText = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "Waiting for telemetry";

  const metrics = [
    {
      label: "ALTITUDE",
      value: iss ? formatNumber(iss.altitude) : "--",
      unit: "km",
    },
    {
      label: "VELOCITY",
      value: iss ? formatNumber(iss.velocity) : "--",
      unit: "km/h",
    },
    {
      label: "LATITUDE",
      value: iss ? formatNumber(iss.latitude, 4) : "--",
      unit: "°",
    },
    {
      label: "LONGITUDE",
      value: iss ? formatNumber(iss.longitude, 4) : "--",
      unit: "°",
    },
  ];

  return (
    <section className="orbit-hud">
      <div className="orbit-hud-header">
        <div>
          <p className="orbit-eyebrow">ORBITAL TELEMETRY</p>
          <h2>ISS Tracking</h2>
        </div>

        <span className={`orbit-status ${connected ? "online" : "offline"}`}>
          <span className="orbit-status-dot" />
          {connected ? "LIVE" : "RECONNECTING"}
        </span>
      </div>

      <div className="orbit-hud-grid">
        {metrics.map((metric) => (
          <article className="orbit-metric" key={metric.label}>
            <span className="orbit-metric-label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <span className="orbit-metric-unit">{metric.unit}</span>
          </article>
        ))}
      </div>

      <div className="orbit-hud-footer">
        <span>ISS · NORAD 25544</span>
        <span>Updated: {updatedText}</span>
      </div>
    </section>
  );
}
