
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Globe2,
  Home,
  Map,
  Newspaper,
  Radio,
  Satellite,
  Search,
  ShieldCheck,
  Signal,
  Orbit,
  ExternalLink,
  RefreshCw,
  Clock3,
} from "lucide-react";
import GroundTrackMap from "@/components/GroundTrackMap";
import { saveTelemetryRecord } from "@/lib/telemetry-history";
import CursorEffects from "@/components/CursorEffects";

const EarthScene = dynamic(() => import("@/components/EarthScene"), {
  ssr: false,
  loading: () => (
    <div className="earth-loading">
      <Globe2 size={36} />
      <p>INITIALIZING WEBGL EARTH...</p>
    </div>
  ),
});

type ISSPosition = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
};

type SpaceArticle = {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  published_at: string;
  summary: string;
};

const ISS_API =
  process.env.NEXT_PUBLIC_ISS_API_URL ??
  "https://api.wheretheiss.at/v1/satellites/25544";

const SPACE_NEWS_API =
  process.env.NEXT_PUBLIC_SPACE_NEWS_API_URL ??
  "https://api.spaceflightnewsapi.net/v4/articles/";

const NEWS_LIMIT = Number(
  process.env.NEXT_PUBLIC_SPACE_NEWS_LIMIT ?? "5"
);

const ISS_REFRESH_INTERVAL = Number(
  process.env.NEXT_PUBLIC_ISS_REFRESH_INTERVAL_MS ?? "5000"
);

const NEWS_REFRESH_INTERVAL = Number(
  process.env.NEXT_PUBLIC_NEWS_REFRESH_INTERVAL_MS ?? "300000"
);


function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="metric">
      <span className="orbit-label">{label}</span>
      <div className="metric-number">
        {value}
        {unit && <small>{unit}</small>}
      </div>
    </div>
  );
}

export default function HomePage() {
  
  const [iss, setIss] = useState<ISSPosition | null>(null);
  const [articles, setArticles] = useState<SpaceArticle[]>([]);
  const [issError, setIssError] = useState("");
  const [newsError, setNewsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchISS() {
    try {
      const response = await fetch(ISS_API, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("ISS service is temporarily unavailable.");
      }

      const data: ISSPosition = await response.json();

      setIss(data);
      setIssError("");
      setLastUpdated(new Date());
    } catch {
      setIssError("Unable to load live ISS telemetry. Retrying shortly.");
    }
  }

  async function fetchNews() {
    try {
      const url = new URL(SPACE_NEWS_API);
      url.searchParams.set("limit", String(NEWS_LIMIT));

      const response = await fetch(url.toString(), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("News service unavailable.");
      }

      const data: { results: SpaceArticle[] } = await response.json();

      setArticles(data.results ?? []);
      setNewsError("");
    } catch {
      setNewsError("Space news is temporarily unavailable.");
    }
  }

  async function refreshAll() {
    setRefreshing(true);

    try {
      await Promise.all([fetchISS(), fetchNews()]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void fetchISS();
    void fetchNews();

    const issTimer = window.setInterval(() => {
      void fetchISS();
    }, ISS_REFRESH_INTERVAL);

    const newsTimer = window.setInterval(() => {
      void fetchNews();
    }, NEWS_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(issTimer);
      window.clearInterval(newsTimer);
    };
  }, []);

  useEffect(() => {
    if (!iss) return;

    const timestamp = Number(iss.timestamp);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(iss.latitude) ||
      !Number.isFinite(iss.longitude) ||
      !Number.isFinite(iss.altitude) ||
      !Number.isFinite(iss.velocity)
    ) {
      return;
    }

    saveTelemetryRecord({
      timestamp: timestamp * 1000,
      latitude: iss.latitude,
      longitude: iss.longitude,
      altitude: iss.altitude,
      velocity: iss.velocity,
    });
  }, [iss]);

  const isLive = Boolean(iss && !issError);

  return (
    <main className="orbit-app">
      <CursorEffects />

      <aside className="sidebar">
        <a href="#overview" className="brand">
          <span className="brand-icon">
            <Orbit size={32} />
          </span>
          <span>
            <strong>OrbitView</strong>
            <small>SPACE &amp; EARTH MONITOR</small>
          </span>
        </a>

        <div className="sidebar-caption">MISSION CONTROL</div>

        <nav className="sidebar-nav">
          <a className="nav-item active" href="#overview">
            <Home size={18} /> Overview
          </a>
          <a className="nav-item" href="#earth">
            <Globe2 size={18} /> 3D Earth
          </a>
          <a className="nav-item" href="#telemetry">
            <Satellite size={18} /> ISS Tracker
          </a>
          <a className="nav-item" href="#news">
            <Newspaper size={18} /> Space News
          </a>
          <Link className="nav-item" href="/analytics">
            <Activity size={18} /> Analytics
          </Link>
        </nav>

        <div className="sidebar-status">
          <span className="status-dot" />
          PUBLIC DATA MODE
          <p>No API keys configured</p>
        </div>

        <div className="sidebar-footer">
          <Orbit size={21} />
          <p>Explore our planet.</p>
          <p>Track the station.</p>
          <p>Discover the universe.</p>
        </div>
      </aside>

      <section className="dashboard" id="overview">
        <header className="topbar">
          <div className="search-placeholder">
            <Search size={17} />
            <span>Earth observation / ISS telemetry</span>
          </div>

          <div className="topbar-right">
            <span className="utc-time">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Connecting to telemetry..."}
            </span>

            <span className="live-indicator">
              <span className="status-dot" />
              {isLive ? "LIVE" : issError ? "RETRYING" : "CONNECTING"}
            </span>

            <button
              className="icon-button"
              onClick={() => void refreshAll()}
              disabled={refreshing}
              aria-label="Refresh dashboard data"
              title="Refresh data"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "spin" : ""}
              />
            </button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <Signal size={14} /> EARTH ORBITAL OBSERVATION
              </div>
              <h1>Space Operations</h1>
              <p>
                Real-time orbital data, visualized in three dimensions.
              </p>
            </div>

            <div className="mission-badge">
              <Activity size={16} />
              ISS / NORAD 25544
            </div>
          </div>

          <section className="stats-grid" id="telemetry">
            <div className="orbit-panel stat-card">
              <div className="stat-top">
                <span className="orbit-label">ORBITAL ALTITUDE</span>
                <Satellite size={18} />
              </div>
              <div className="orbit-value">
                {iss ? Math.round(iss.altitude).toLocaleString() : "—"}
                <small> km</small>
              </div>
              <div className="stat-foot">Above mean sea level</div>
            </div>

            <div className="orbit-panel stat-card">
              <div className="stat-top">
                <span className="orbit-label">ORBITAL VELOCITY</span>
                <Activity size={18} />
              </div>
              <div className="orbit-value">
                {iss ? Math.round(iss.velocity).toLocaleString() : "—"}
                <small> km/h</small>
              </div>
              <div className="stat-foot">Current reported speed</div>
            </div>

            <div className="orbit-panel stat-card">
              <div className="stat-top">
                <span className="orbit-label">LATITUDE</span>
                <Map size={18} />
              </div>
              <div className="orbit-value">
                {iss ? `${iss.latitude.toFixed(3)}°` : "—"}
              </div>
              <div className="stat-foot">Current station position</div>
            </div>

            <div className="orbit-panel stat-card">
              <div className="stat-top">
                <span className="orbit-label">LONGITUDE</span>
                <Globe2 size={18} />
              </div>
              <div className="orbit-value">
                {iss ? `${iss.longitude.toFixed(3)}°` : "—"}
              </div>
              <div className="stat-foot">Current station position</div>
            </div>
          </section>

          <section className="earth-layout" id="earth">
            <div className="orbit-panel earth-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <Globe2 size={19} /> Earth Visualization
                  </h2>
                  <p>Interactive WebGL planetary view</p>
                </div>
                <span className="live-tag">3D SCENE</span>
              </div>

              <EarthScene
                latitude={iss?.latitude ?? null}
                longitude={iss?.longitude ?? null}
                altitude={iss?.altitude ?? null}
              />

              <div className="earth-footer">
                <span>
                  <span className="legend-dot cyan" /> Live ISS marker
                </span>
                <span>
                  <span className="legend-dot blue" /> Orbital trajectory
                </span>
                <span>Drag to rotate · Scroll to zoom</span>
              </div>
            </div>

            <aside className="orbit-panel telemetry-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    <Satellite size={19} /> ISS Telemetry
                  </h2>
                  <p>International Space Station</p>
                </div>
                <span
                  className={`status-dot ${isLive ? "" : "status-dot-offline"}`}
                />
              </div>

              <div className="tracking-status">
                <div className="tracking-status-icon">
                  {isLive ? <Signal size={18} /> : <Clock3 size={18} />}
                </div>
                <div>
                  <strong>
                    {isLive
                      ? "Tracking active"
                      : issError
                        ? "Connection interrupted"
                        : "Acquiring signal"}
                  </strong>
                  <p>
                    {isLive
                      ? "Live position data received"
                      : "Waiting for the next successful update"}
                  </p>
                </div>
                <span className="tracking-status-light" />
              </div>

              {issError && (
                <div className="api-message error-message">{issError}</div>
              )}

              <div className="telemetry-list">
                <Metric
                  label="Latitude"
                  value={iss ? `${iss.latitude.toFixed(4)}°` : "Loading"}
                />
                <Metric
                  label="Longitude"
                  value={iss ? `${iss.longitude.toFixed(4)}°` : "Loading"}
                />
                <Metric
                  label="Altitude"
                  value={iss ? iss.altitude.toFixed(1) : "—"}
                  unit=" km"
                />
                <Metric
                  label="Velocity"
                  value={iss ? Math.round(iss.velocity).toLocaleString() : "—"}
                  unit=" km/h"
                />
              </div>

              <div className="coordinates-box">
                <span className="orbit-label">CURRENT COORDINATES</span>
                <p>
                  {iss
                    ? `${iss.latitude.toFixed(4)}, ${iss.longitude.toFixed(4)}`
                    : "Waiting for satellite data"}
                </p>
              </div>

              <div className="telemetry-update">
                <Clock3 size={14} />
                <span>Last successful update</span>
                <strong>
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : "Pending"}
                </strong>
              </div>

              <div className="data-source">
                <ShieldCheck size={15} />
                <span>Source: Where the ISS at?</span>
              </div>

              <a
                className="external-link"
                href="https://wheretheiss.at/"
                target="_blank"
                rel="noreferrer"
              >
                View data provider <ExternalLink size={14} />
              </a>
            </aside>
          </section>

          <GroundTrackMap
            latitude={iss?.latitude ?? null}
            longitude={iss?.longitude ?? null}
            altitude={iss?.altitude ?? null}
          />

          <section className="orbit-panel news-panel" id="news">
            <div className="panel-heading news-heading">
              <div>
                <h2>
                  <Newspaper size={19} /> Latest Space News
                </h2>
                <p>Recent articles from the spaceflight community</p>
              </div>
              <span className="live-tag">PUBLIC FEED</span>
            </div>

            {newsError && (
              <div className="api-message error-message">{newsError}</div>
            )}

            {!articles.length && !newsError && (
              <div className="news-empty">
                Loading latest space articles...
              </div>
            )}

            <div className="news-grid">
              {articles.map((article) => (
                <a
                  className="news-card"
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="news-image">
                    {article.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={article.image_url}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <Orbit size={30} />
                    )}
                  </div>
                  <div className="news-copy">
                    <span className="news-source">
                      {article.news_site} · {formatDate(article.published_at)}
                    </span>
                    <h3>{article.title}</h3>
                    <p>
                      {article.summary || "Read the full article for details."}
                    </p>
                    <span className="read-article">
                      Read article <ExternalLink size={13} />
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="news-attribution">
              <Radio size={14} />
              News data provided by Spaceflight News API
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>ORBITVIEW / SPACE &amp; EARTH MONITOR</span>
            <span>
              Independent educational visualization · Public data
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}
