# OrbitView — Space & Earth Monitor

OrbitView is a frontend-focused ISS observation dashboard built with Next.js, TypeScript, React Three Fiber, Three.js, and public data sources.

## Features

- Live ISS position, altitude, and velocity from Where the ISS at?
- Interactive 3D Earth visualization and ISS marker.
- Ground-track display and browser-local telemetry history.
- Telemetry charts, mission status checks, and recorded-position replay.
- Approximate ISS pass-window estimates from current CelesTrak TLE data.
- CSV and JSON export for locally stored telemetry.
- Spaceflight news feed and analytics view.

## Setup

```bash
npm install
npm install satellite.js
npm run dev
```

Create `.env.local` if you want to override public API defaults:

```dotenv
NEXT_PUBLIC_ISS_API_URL=https://api.wheretheiss.at/v1/satellites/25544
NEXT_PUBLIC_SPACE_NEWS_API_URL=https://api.spaceflightnewsapi.net/v4/articles/
NEXT_PUBLIC_SPACE_NEWS_LIMIT=5
NEXT_PUBLIC_ISS_REFRESH_INTERVAL_MS=5000
NEXT_PUBLIC_NEWS_REFRESH_INTERVAL_MS=300000
```

Open `http://localhost:3000`.

## Architecture overview

- `src/app/page.tsx`: dashboard composition, public API polling, and local telemetry persistence.
- `src/components/EarthScene.tsx`: client-rendered WebGL Earth and camera interactions.
- `src/components/MissionControlCenter.tsx`: health/status cards and saved-position replay.
- `src/components/SatellitePassForecast.tsx`: observer coordinates and approximate pass calculation.
- `src/components/TelemetryExport.tsx`: client-side CSV/JSON export.
- `src/app/api/iss/tle/route.ts`: server-side proxy/cache for current ISS TLE.
- `src/lib/telemetry-history.ts`: browser-local telemetry history.

## Data and privacy

Telemetry history is stored in the browser, not a shared database. CSV and JSON exports are generated locally. The pass forecast uses manually entered coordinates by default; device geolocation is only requested after the user clicks the location button. Never commit `.env.local` or credentials.

## Known limitations

Pass estimates are approximate candidate windows. The current implementation uses a simplified geometric horizon and does not model terrain, obstructions, weather, atmospheric refraction, twilight, or a custom elevation mask. It is an educational visualization and not a mission-critical or official NASA service.

## Release verification

Follow [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md). Add current desktop/mobile screenshots before publishing the repository; no screenshots are bundled here because they should reflect the running build.
