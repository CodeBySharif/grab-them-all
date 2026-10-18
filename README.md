# Grab Them All

## Project description

Grab Them All is a Progressive Web App for Langkawi ferry schedules. It scrapes the public Langkawi Ferry Line timetable, shows three days of sailings, and uses your GPS to estimate drive time and distance to the Langkawi ferry terminal so you can decide whether a trip is still worth taking.

Stack: React (Vite + TypeScript) frontend, ASP.NET Core API, Docker. No accounts. Optional OpenRouteService key for road routing (haversine fallback otherwise).

Live app: [https://grab-them-all.shariflab.my](https://grab-them-all.shariflab.my)

## Problem statement

Ferry windows are high-demand for Grab and taxi drivers on Langkawi — passengers need rides to and from the terminal. The official timetable lives on a website that is awkward to check while deciding whether to accept a job. Drivers still have to guess whether they can reach the terminal before the sailing (or before an inbound ferry arrives).

## How the project solves the problem

1. The API scrapes and caches ferry schedules (about 30 minutes) and exposes them as JSON.
2. The PWA shows a three-day grid for Kedah ↔ Langkawi and Perlis ↔ Langkawi (inbound and outbound).
3. With location enabled, each visit refreshes GPS and estimates drive **time and distance** to the terminal (OpenRouteService when configured, otherwise haversine).
4. Per-trip Yes/No, leave-by times, and inbound arrival windows use that estimate plus route-specific rules.
5. Priority alerts (in-app toasts; optional push) surface sailings that need attention soon.

## Target user

- Grab / taxi drivers on Langkawi who pick up or drop off around ferry times
- Passengers who need a quick check of whether they can still catch a sailing

## Use case

- A driver opens the installed PWA before an evening rush, enables location once, and sees which outbound ferries they can still make from their current spot.
- On reopen later the same day, the app updates location and drive estimate without asking for permission again, then refreshes Yes/No on the grid.
- A passenger checks inbound Kedah → Langkawi sailings and the estimated arrival window at the terminal.
- Someone installs the app to the home screen and still sees the last cached schedule offline.

## Key features

- Three-day ferry schedule grid (four routes, fixed trip slots)
- Server-side schedule cache with stale fallback if the ferry site is slow
- GPS drive-time and distance to Langkawi terminal; fresh fix on each open after location is enabled
- Yes/No indicators, leave-by times, inbound arrival windows, outbound “be at terminal” timing
- Priority alerts (toasts; optional notifications)
- Installable PWA with offline schedule cache
- Flight tab placeholder (“Coming soon”)
- Same-origin `/api` via nginx in production Docker images

## How to pull and run the code

### Clone

```bash
git clone https://github.com/CodeBySharif/grab-them-all.git
cd grab-them-all
```

### Option A — Docker (full stack)

```bash
cp .env.example .env
# Optional: set OPENROUTESERVICE_API_KEY in .env for road routing

docker compose up --build
```

- Web: [http://localhost:8081](http://localhost:8081)
- API: [http://localhost:8080](http://localhost:8080)

### Option B — Local dev (two terminals)

```bash
# Terminal 1 — API
cd backend/FerryFlight.Api
dotnet run
# → http://localhost:5000
```

```bash
# Terminal 2 — PWA
cd frontend
npm install
npm run dev
# → http://localhost:5173 (Vite proxies /api to the backend)
```

### Useful API checks

```bash
curl http://localhost:8080/api/schedules/ferry
curl "http://localhost:8080/api/estimation/travel-times?latitude=6.35&longitude=99.80"
```

### Deploy

Push to `main` deploys via GitHub Actions to Google Cloud Run. See [DEPLOYMENT.md](DEPLOYMENT.md).

Deeper walkthrough of architecture and files: [documentation/README.md](documentation/README.md).
