"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, CirclePause, CirclePlay, Clock3, RotateCcw, Satellite, ShieldAlert, Sparkles } from "lucide-react";
import type { TelemetryRecord } from "@/lib/telemetry-history";

type Position = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
};

type Props = {
  iss: Position | null;
  lastUpdated: number | null;
  error: string;
  history: TelemetryRecord[];
  onReplayPosition: (position: Position | null) => void;
};

function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function MissionControlCenter({ iss, lastUpdated, error, history, onReplayPosition }: Props) {
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const points = useMemo(() => [...history].filter((p) =>
    Number.isFinite(p.timestamp) && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Number.isFinite(p.altitude) && Number.isFinite(p.velocity)
  ).sort((a, b) => a.timestamp - b.timestamp), [history]);

  useEffect(() => {
    if (!playing || points.length < 2) return;
    const timer = window.setInterval(() => {
      setReplayIndex((current) => {
        if (current >= points.length - 1) {
          setPlaying(false);
          return points.length - 1;
        }
        return current + 1;
      });
    }, Math.max(120, 1000 / speed));
    return () => window.clearInterval(timer);
  }, [playing, points.length, speed]);

  useEffect(() => {
    if (!playing || !points[replayIndex]) return;
    const point = points[replayIndex];
    onReplayPosition({ ...point, timestamp: point.timestamp / 1000 });
  }, [playing, replayIndex, points, onReplayPosition]);

  const freshnessSeconds = lastUpdated === null ? null : Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
  const stale = freshnessSeconds === null || freshnessSeconds > 20;
  const status = error ? "Connection issue" : !iss ? "Acquiring telemetry" : stale ? "Data may be stale" : "Telemetry nominal";
  const statusTone = error || stale ? "warning" : "good";
  const nextOrbitMinutes = iss ? 92 : null; // Approximate ISS orbital period, not a pass prediction.
  const currentPoint = points[replayIndex];

  function startReplay() {
    if (points.length < 2) return;
    if (replayIndex >= points.length - 1) setReplayIndex(0);
    setPlaying(true);
    const point = points[replayIndex >= points.length - 1 ? 0 : replayIndex];
    onReplayPosition({ ...point, timestamp: point.timestamp / 1000 });
  }

  function stopReplay() {
    setPlaying(false);
    onReplayPosition(null);
  }

  function changeReplayIndex(value: number) {
    const index = Math.max(0, Math.min(points.length - 1, value));
    setReplayIndex(index);
    const point = points[index];
    if (point) onReplayPosition({ ...point, timestamp: point.timestamp / 1000 });
  }

  return (
    <section className="mission-control-wrap" aria-label="Mission control center">
      <div className="mission-control-heading">
        <div>
          <div className="mission-kicker"><Sparkles size={14} /> OPERATIONS CONSOLE</div>
          <h2>Mission Control Center</h2>
          <p>Live status, data-quality monitoring, recorded telemetry replay, and orbital context.</p>
        </div>
        <span className={`mission-status-pill ${statusTone}`}><span />{status}</span>
      </div>

      <div className="mission-control-grid">
        <article className="mission-control-card mission-status-card">
          <div className="mission-card-top"><span className="mission-card-label">TELEMETRY LINK</span>{error || stale ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}</div>
          <strong className="mission-card-value">{error ? "DEGRADED" : iss ? (stale ? "STALE DATA" : "NOMINAL") : "CONNECTING"}</strong>
          <p>{error || (lastUpdated ? `Last successful update ${timeLabel(lastUpdated)}` : "Waiting for the first successful response.")}</p>
          {error && <div className="mission-inline-alert"><AlertTriangle size={14} /> {error}</div>}
        </article>

        <article className="mission-control-card">
          <div className="mission-card-top"><span className="mission-card-label">ORBITAL PROFILE</span><Satellite size={18} /></div>
          <strong className="mission-card-value">{iss ? `${Math.round(iss.altitude).toLocaleString()} km` : "—"}</strong>
          <p>Reported altitude · velocity {iss ? `${Math.round(iss.velocity).toLocaleString()} km/h` : "—"}</p>
          <div className="mission-mini-stats"><span>LAT <b>{iss ? `${iss.latitude.toFixed(3)}°` : "—"}</b></span><span>LON <b>{iss ? `${iss.longitude.toFixed(3)}°` : "—"}</b></span></div>
        </article>

        <article className="mission-control-card mission-alert-card">
          <div className="mission-card-top"><span className="mission-card-label">SYSTEM CHECKS</span><Activity size={18} /></div>
          <ul className="mission-check-list">
            <li><span className={iss ? "check-dot good" : "check-dot warning"} />ISS position feed <b>{iss ? "Available" : "Waiting"}</b></li>
            <li><span className={!error ? "check-dot good" : "check-dot warning"} />API connection <b>{error ? "Retrying" : "No error"}</b></li>
            <li><span className={points.length > 1 ? "check-dot good" : "check-dot warning"} />History archive <b>{points.length} points</b></li>
          </ul>
        </article>
      </div>

      <div className="mission-control-lower">
        <article className="mission-control-card replay-card">
          <div className="mission-section-heading"><div><span className="mission-card-label">RECORDED DATA</span><h3>Mission Replay</h3></div><span className="mission-record-count">{points.length} samples</span></div>
          <p className="mission-muted">Replay locally saved ISS samples on the 3D globe. More history becomes available while the dashboard is running.</p>
          <div className="replay-controls">
            <button type="button" className="mission-action-button primary" onClick={playing ? stopReplay : startReplay} disabled={points.length < 2}>
              {playing ? <><CirclePause size={16} /> Pause</> : <><CirclePlay size={16} /> {replayIndex > 0 && replayIndex < points.length - 1 ? "Resume" : "Play replay"}</>}
            </button>
            <button type="button" className="mission-action-button" onClick={() => { setPlaying(false); setReplayIndex(0); onReplayPosition(null); }} disabled={!points.length}><RotateCcw size={15} /> Reset</button>
            <label className="replay-speed">Speed <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label>
          </div>
          <input className="replay-range" aria-label="Replay timeline" type="range" min={0} max={Math.max(0, points.length - 1)} value={Math.min(replayIndex, Math.max(0, points.length - 1))} disabled={points.length < 2} onChange={(e) => changeReplayIndex(Number(e.target.value))} />
          <div className="replay-timeline-labels"><span>{points.length ? timeLabel(points[0].timestamp) : "No history yet"}</span><span>{currentPoint ? `Selected ${timeLabel(currentPoint.timestamp)}` : "Live view"}</span><span>{points.length ? timeLabel(points[points.length - 1].timestamp) : "—"}</span></div>
          {points.length < 2 && <p className="mission-empty-note">Collect at least two telemetry samples to use replay.</p>}
        </article>

        <article className="mission-control-card orbit-forecast-card">
          <div className="mission-section-heading"><div><span className="mission-card-label">ORBITAL CONTEXT</span><h3>Orbit Estimate</h3></div><Clock3 size={19} /></div>
          <div className="orbit-estimate-number">{nextOrbitMinutes ? `~${nextOrbitMinutes} min` : "—"}</div>
          <p className="mission-muted">Typical ISS orbital period (approximate).</p>
          <div className="orbit-estimate-track"><span /><span /><span /><span /><span /></div>
          <div className="orbit-estimate-caption"><span>Current reported position</span><span>Earth orbit</span></div>
          <div className="mission-disclaimer"><AlertTriangle size={15} /><span>This is an educational orbital-period reference, not a predicted local pass or visibility time. Accurate pass forecasts require current orbital elements (TLE/GP data) and an observer location.</span></div>
        </article>
      </div>
    </section>
  );
}
