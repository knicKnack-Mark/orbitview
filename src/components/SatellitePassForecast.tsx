"use client";

import { useState } from "react";
import { Crosshair, MapPin, RefreshCw, Satellite, ShieldAlert } from "lucide-react";
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec } from "satellite.js";

type ForecastPass = { start: number; peak: number; end: number; closestKm: number };
type TleResponse = { name: string; line1: string; line2: string; fetchedAt: string; error?: string };
const EARTH_RADIUS_KM = 6371;
const SEARCH_HOURS = 24;
const STEP_MS = 30_000;

function radians(value: number) { return (value * Math.PI) / 180; }
function greatCircleKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p1 = radians(lat1), p2 = radians(lat2), dp = radians(lat2 - lat1), dl = radians(lon2 - lon1);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}
function fmtTime(ms: number) {
  return new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SatellitePassForecast() {
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Example coordinates (editable; not your device location)");
  const [passes, setPasses] = useState<ForecastPass[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tleFetchedAt, setTleFetchedAt] = useState("");

  function useDeviceLocation() {
    if (!navigator.geolocation) { setError("Geolocation is not supported by this browser."); return; }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(Number(position.coords.latitude.toFixed(5)));
        setLongitude(Number(position.coords.longitude.toFixed(5)));
        setLocationLabel("Browser-provided location");
      },
      () => setError("Location permission was denied or the position could not be determined. You can enter coordinates manually."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function calculatePasses() {
    setBusy(true); setError(""); setPasses([]);
    try {
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error("Enter a latitude from -90 to 90 and longitude from -180 to 180.");
      }
      const response = await fetch("/api/iss/tle", { cache: "no-store" });
      const tle = (await response.json()) as TleResponse;
      if (!response.ok || !tle.line1 || !tle.line2) throw new Error(tle.error || "Current orbital elements are unavailable.");
      setTleFetchedAt(tle.fetchedAt);
      const satrec = twoline2satrec(tle.line1, tle.line2);
      const now = Date.now();
      const horizonMs = SEARCH_HOURS * 60 * 60 * 1000;
      const altitudeForHorizon = 420;
      const horizonAngle = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitudeForHorizon));
      const horizonKm = horizonAngle * EARTH_RADIUS_KM;
      const samples: Array<{ time: number; distance: number }> = [];
      for (let t = now; t <= now + horizonMs; t += STEP_MS) {
        const date = new Date(t);
        const pv = propagate(satrec, date);
        const position = pv.position;
        if (!position || typeof position === "boolean") continue;
        const geo = eciToGeodetic(position, gstime(date));
        const subLat = degreesLat(geo.latitude);
        const subLon = degreesLong(geo.longitude);
        samples.push({ time: t, distance: greatCircleKm(latitude, longitude, subLat, subLon) });
      }
      const found: ForecastPass[] = [];
      let start: number | null = null;
      let closest = { time: now, distance: Number.POSITIVE_INFINITY };
      for (const sample of samples) {
        if (sample.distance <= horizonKm) {
          if (start === null) { start = sample.time; closest = sample; }
          if (sample.distance < closest.distance) closest = sample;
        } else if (start !== null) {
          found.push({ start, peak: closest.time, end: sample.time, closestKm: closest.distance });
          start = null;
        }
      }
      if (start !== null) found.push({ start, peak: closest.time, end: now + horizonMs, closestKm: closest.distance });
      setPasses(found.slice(0, 8));
      if (!found.length) setError("No candidate passes were found in the next 24 hours with this approximate horizon model. Try again later or verify your coordinates.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to calculate pass estimates.");
    } finally { setBusy(false); }
  }

  return (
    <section className="orbit-panel ov-pass-panel" aria-labelledby="ov-pass-title">
      <div className="panel-heading">
        <div><h2 id="ov-pass-title"><Satellite size={19} /> ISS Pass Forecast</h2><p>Estimate candidate overhead passes for a selected observer location.</p></div>
        <span className="live-tag">NEXT 24 HOURS</span>
      </div>
      <div className="ov-pass-location-label"><MapPin size={14} /> {locationLabel}</div>
      <div className="ov-pass-form">
        <label>Latitude (°)<input type="number" min={-90} max={90} step="0.00001" value={latitude} onChange={(event) => { setLatitude(Number(event.target.value)); setLocationLabel("Custom coordinates"); }} /></label>
        <label>Longitude (°)<input type="number" min={-180} max={180} step="0.00001" value={longitude} onChange={(event) => { setLongitude(Number(event.target.value)); setLocationLabel("Custom coordinates"); }} /></label>
      </div>
      <div className="ov-pass-actions">
        <button type="button" className="ov-action-button" onClick={useDeviceLocation}><Crosshair size={15} /> Use my location</button>
        <button type="button" className="ov-action-button primary" onClick={() => void calculatePasses()} disabled={busy}>{busy ? <RefreshCw size={15} className="spin" /> : <Satellite size={15} />}{busy ? "Calculating…" : "Calculate passes"}</button>
      </div>
      {error && <div className="ov-pass-message"><ShieldAlert size={16} /> {error}</div>}
      {passes.length > 0 && <div className="ov-pass-results"><div className="ov-pass-results-title">Candidate passes · {passes.length}</div>{passes.map((pass, index) => <article className="ov-pass-result" key={`${pass.start}-${index}`}><div><span>PASS {String(index + 1).padStart(2, "0")}</span><strong>{fmtTime(pass.start)}</strong><small>Window ends {fmtTime(pass.end)}</small></div><div><span>CLOSEST APPROACH</span><strong>{fmtTime(pass.peak)}</strong><small>Approx. {Math.round(pass.closestKm).toLocaleString()} km surface distance</small></div></article>)}</div>}
      {tleFetchedAt && <p className="ov-muted">Orbital elements retrieved {fmtTime(new Date(tleFetchedAt).getTime())}. Forecast is approximate; it does not account for terrain, weather, twilight, or precise elevation masks.</p>}
      <div className="ov-pass-disclaimer">These are approximate candidate pass windows derived from current TLE orbital elements. Confirm times with a trusted satellite pass service before observation.</div>
    </section>
  );
}
