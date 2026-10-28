
"use client";

import { useEffect, useState } from "react";

type OrbitViewLoaderProps = {
  isReady: boolean;
  minimumDuration?: number;
};

export default function OrbitViewLoader({
  isReady,
  minimumDuration = 1800,
}: OrbitViewLoaderProps) {
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();

    const minimumTimer = window.setTimeout(() => {
      setMinimumTimePassed(true);
    }, minimumDuration);

    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.min(
        94,
        Math.round((elapsed / (minimumDuration * 1.8)) * 100)
      );

      setProgress((current) => Math.max(current, nextProgress));
    }, 40);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearInterval(progressTimer);
    };
  }, [minimumDuration]);

  useEffect(() => {
    if (!isReady || !minimumTimePassed) return;

    setProgress(100);
    setExiting(true);

    const exitTimer = window.setTimeout(() => {
      setHidden(true);
    }, 650);

    return () => window.clearTimeout(exitTimer);
  }, [isReady, minimumTimePassed]);

  if (hidden) return null;

  return (
    <div
      className={`orbit-loader ${exiting ? "orbit-loader--exit" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading OrbitView"
      aria-hidden={exiting}
    >
      <div className="orbit-loader__grid" />

      <div className="orbit-loader__content">
        <div className="orbit-loader__visual">
          <div className="orbit-loader__orbit orbit-loader__orbit--one" />
          <div className="orbit-loader__orbit orbit-loader__orbit--two" />

          <div className="orbit-loader__planet">
            <span />
          </div>

          <div className="orbit-loader__satellite">
            <span />
            <span />
          </div>
        </div>

        <p className="orbit-loader__eyebrow">
          SPACE SITUATIONAL AWARENESS
        </p>

        <h1 className="orbit-loader__title">
          ORBIT<span>VIEW</span>
        </h1>

        <p className="orbit-loader__status">
          {isReady
            ? "SYNCHRONIZING ORBITAL DISPLAY"
            : "ESTABLISHING MISSION CONTROL"}
        </p>

        <div
          className="orbit-loader__progress-track"
          role="progressbar"
          aria-label="Initialization progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="orbit-loader__progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="orbit-loader__metadata">
          <span>INITIALIZING SYSTEMS</span>
          <span>{progress.toString().padStart(2, "0")}%</span>
        </div>
      </div>

      <div className="orbit-loader__footer">
        <span>ORBITVIEW // MISSION CONTROL</span>
        <span>EARTH OBSERVATION SYSTEM</span>
      </div>
    </div>
  );
}
