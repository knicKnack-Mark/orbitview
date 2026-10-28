# OrbitView — final polish and feature additions

This package adds:
- ISS pass-window estimates for a user-entered or browser-provided observer location.
- CSV and JSON exports of locally saved telemetry.
- Validation for incoming ISS telemetry in the homepage fetch path.
- Responsive styles for the new panels.
- A production and accessibility checklist.

## Files

- `src/app/page.tsx` — updated homepage based on the current OrbitView page shared in the conversation.
- `src/components/SatellitePassForecast.tsx` — pass estimate UI and TLE propagation.
- `src/components/TelemetryExport.tsx` — CSV/JSON downloads.
- `src/app/api/iss/tle/route.ts` — server-side cached TLE endpoint.
- `mission-control-additions.css` — append to `src/app/globals.css`.
- `docs/RELEASE_CHECKLIST.md` — verification checklist.

## Install dependency

From the OrbitView frontend folder:

```bash
npm install satellite.js
```

## Apply

1. Back up your current `src/app/page.tsx`.
2. Replace it with this package's `src/app/page.tsx`.
3. Copy the new `SatellitePassForecast.tsx` and `TelemetryExport.tsx` into `src/components/`.
4. Copy `src/app/api/iss/tle/route.ts` to the same path in your project.
5. Append `mission-control-additions.css` to the end of `src/app/globals.css` (do not replace your existing stylesheet).
6. Run `npm run build`, then `npm run dev`.

## Pass forecast notes

The feature downloads the current ISS TLE from CelesTrak through a Next.js route cached for ten minutes and uses `satellite.js` to propagate the orbit. The displayed windows are approximate candidates based on a simplified geometric horizon, not guaranteed visible passes. Terrain, local obstructions, atmospheric refraction, weather, twilight, and a precision elevation mask are not modeled. Confirm observation times with an established pass prediction service.

The default coordinates are a clearly labeled editable example for Naga, Philippines; they are not detected device coordinates. The browser location button requires explicit user permission. Coordinates remain in local component state and are not sent to the TLE provider.

## Telemetry export notes

CSV and JSON export only the telemetry history already stored in this browser. Export does not upload or share data. A CSV/JSON export is disabled when no valid samples exist.

## Reliability caveat

The page validates basic numeric telemetry fields. Provider/network outages can still happen, and the browser-local history can be cleared by the user or browser. This is not a mission-critical tracking system.
