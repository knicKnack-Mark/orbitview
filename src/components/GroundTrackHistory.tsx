
"use client";

type TrackPoint = {
  timestamp: number;
  latitude: number;
  longitude: number;
};

type GroundTrackHistoryProps = {
  points: TrackPoint[];
  maxPoints?: number;
};

export default function GroundTrackHistory({
  points,
  maxPoints = 80,
}: GroundTrackHistoryProps) {
  const recent = points
    .filter(
      (point) =>
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude) &&
        point.latitude >= -90 &&
        point.latitude <= 90 &&
        point.longitude >= -180 &&
        point.longitude <= 180
    )
    .slice(-maxPoints);

  const projectX = (longitude: number) => ((longitude + 180) / 360) * 100;
  const projectY = (latitude: number) => ((90 - latitude) / 180) * 100;

  const path = recent
    .map((point, index) => {
      const x = projectX(point.longitude);
      const y = projectY(point.latitude);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const latest = recent.at(-1);

  return (
    <section className="ground-history">
      <div className="ground-history-heading">
        <div>
          <p className="orbit-eyebrow">POSITION ARCHIVE</p>
          <h2>Ground Track</h2>
        </div>
        <span>{recent.length} points</span>
      </div>

      <div className="ground-history-map">
        <div className="ground-history-grid" />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="Recent recorded ISS positions on an equirectangular world grid"
        >
          {path && (
            <path
              d={path}
              fill="none"
              stroke="#48d9ff"
              strokeWidth="0.65"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {recent.map((point, index) => (
            <circle
              key={`${point.timestamp}-${index}`}
              cx={projectX(point.longitude)}
              cy={projectY(point.latitude)}
              r={index === recent.length - 1 ? 1.6 : 0.65}
              fill={index === recent.length - 1 ? "#ffffff" : "#48d9ff"}
              opacity={index === recent.length - 1 ? 1 : 0.55}
            >
              <title>
                {new Date(point.timestamp).toLocaleString()} ·{" "}
                {point.latitude.toFixed(3)}, {point.longitude.toFixed(3)}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <div className="ground-history-footer">
        <span>
          {latest
            ? `Latest: ${latest.latitude.toFixed(3)}°, ${latest.longitude.toFixed(3)}°`
            : "Waiting for recorded positions"}
        </span>
        <span>Longitude −180° to 180°</span>
      </div>
    </section>
  );
}
