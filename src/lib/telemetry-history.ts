
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Graticule,
  Line,
  Marker,
  Sphere,
} from "react-simple-maps";

type GroundTrackMapProps = {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
};

type Coordinate = [number, number];

const WORLD_MAP_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const MAX_TRACK_POINTS = 120;

export default function GroundTrackMap({
  latitude,
  longitude,
  altitude,
}: GroundTrackMapProps) {
  const [track, setTrack] = useState<Coordinate[]>([]);

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    const point: Coordinate = [longitude, latitude];

    setTrack((previous) => {
      const last = previous[previous.length - 1];

      // Avoid adding duplicate coordinates between refreshes.
      if (
        last &&
        Math.abs(last[0] - point[0]) < 0.0001 &&
        Math.abs(last[1] - point[1]) < 0.0001
      ) {
        return previous;
      }

      return [...previous, point].slice(-MAX_TRACK_POINTS);
    });
  }, [latitude, longitude]);

  // Split the track at the international date line so that
  // the trail doesn't draw a long line across the entire map.
  const trackSegments = useMemo(() => {
    const segments: Coordinate[][] = [];
    let segment: Coordinate[] = [];

    for (const point of track) {
      const previous = segment[segment.length - 1];

      if (previous && Math.abs(point[0] - previous[0]) > 180) {
        if (segment.length > 1) segments.push(segment);
        segment = [];
      }

      segment.push(point);
    }

    if (segment.length > 1) segments.push(segment);

    return segments;
  }, [track]);

  const hasPosition =
    latitude !== null &&
    longitude !== null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <section className="ground-track-card">
      <div className="ground-track-header">
        <div>
          <div className="section-eyebrow">ORBITAL VISUALIZATION</div>
          <h2>ISS Ground Track</h2>
          <p>Live position and recent path over Earth</p>
        </div>

        <div className="ground-track-badge">
          <span className={hasPosition ? "status-dot" : "status-dot offline"} />
          {hasPosition ? "TRACKING" : "WAITING FOR DATA"}
        </div>
      </div>

      <div className="ground-track-map">
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: 145 }}
          width={800}
          height={400}
          style={{ width: "100%", height: "auto" }}
        >
          <Sphere
            fill="#071521"
            stroke="#164052"
            strokeWidth={0.8}
          />

          <Graticule
            stroke="#1b3c4c"
            strokeWidth={0.45}
            strokeOpacity={0.8}
          />

          <Geographies geography={WORLD_MAP_URL}>
            {({ geographies }) =>
              geographies.map((geography) => (
                <Geography
                  key={geography.rsmKey}
                  geography={geography}
                  fill="#102b3a"
                  stroke="#285062"
                  strokeWidth={0.45}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#164052", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {trackSegments.map((segment, index) => (
            <Line
              key={`track-${index}`}
              coordinates={segment}
              stroke="#00f2fe"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

          {hasPosition && (
            <Marker coordinates={[longitude, latitude]}>
              <circle r={11} fill="#00f2fe" opacity={0.12} />
              <circle r={6} fill="#00f2fe" opacity={0.2} />
              <circle
                r={3.5}
                fill="#ffffff"
                stroke="#00f2fe"
                strokeWidth={2}
              />
            </Marker>
          )}
        </ComposableMap>

        {!hasPosition && (
          <div className="ground-track-overlay">
            Waiting for the first ISS position update…
          </div>
        )}
      </div>

      <div className="ground-track-footer">
        <div className="track-legend">
          <span className="legend-line" />
          <span>Recent ground track</span>
        </div>

        <div className="track-coordinates">
          {hasPosition
            ? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
            : "Coordinates unavailable"}
        </div>
      </div>

      <div className="ground-track-stats">
        <div>
          <span>LATITUDE</span>
          <strong>{hasPosition ? `${latitude.toFixed(4)}°` : "—"}</strong>
        </div>
        <div>
          <span>LONGITUDE</span>
          <strong>{hasPosition ? `${longitude.toFixed(4)}°` : "—"}</strong>
        </div>
        <div>
          <span>ALTITUDE</span>
          <strong>
            {altitude !== null && Number.isFinite(altitude)
              ? `${altitude.toFixed(1)} km`
              : "—"}
          </strong>
        </div>
      </div>
    </section>
  );
}
