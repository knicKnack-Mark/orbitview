# OrbitView release checklist

## Build and static checks
- [ ] `npm install satellite.js`
- [ ] `npm run build`
- [ ] Run your project's lint command if configured (`npm run lint`)
- [ ] Check browser console for hydration warnings, React key warnings, and failed requests.

## Live telemetry resilience
- [ ] Dashboard renders before the first API response.
- [ ] Invalid/missing latitude, longitude, altitude, velocity, or timestamp is rejected.
- [ ] ISS API outage shows a visible error and retries on the normal refresh interval.
- [ ] Manual refresh disables while active and returns to enabled after completion.
- [ ] Telemetry status correctly shows connecting, nominal, stale, and degraded states.
- [ ] Stored history survives reload and handles an empty/corrupt localStorage value.

## Pass estimates
- [ ] Coordinate validation rejects latitude outside -90..90 and longitude outside -180..180.
- [ ] Browser geolocation only runs after the user clicks the location button.
- [ ] Denied geolocation permission leaves manual coordinates usable.
- [ ] TLE endpoint failure displays an actionable message.
- [ ] Forecast labels explicitly describe results as approximate candidate windows.
- [ ] Compare a few dates with a trusted pass-prediction service before presenting results as validated.

## Export
- [ ] CSV opens correctly in a spreadsheet and includes timestamp, lat/lon, altitude, velocity.
- [ ] JSON is valid and includes export metadata.
- [ ] Empty history disables both export buttons.
- [ ] Export works without a server account or API key.

## Responsive and accessibility
- [ ] Test widths around 360px, 768px, 1024px, and desktop.
- [ ] No horizontal page overflow.
- [ ] Inputs have labels and visible keyboard focus.
- [ ] Buttons work with keyboard and expose disabled states.
- [ ] `prefers-reduced-motion` is respected for new CSS transitions.
- [ ] Check text contrast and chart legends at mobile widths.

## Portfolio / release
- [ ] Add desktop and mobile screenshots to README.
- [ ] Document APIs, local history behavior, environment variables, and known limitations.
- [ ] Never commit `.env.local`, credentials, or personal location data.
