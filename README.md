# Ferry & Flight PWA

**Real-time ferry intelligence for Langkawi drivers and passengers — without opening the ferry website.**

[![Live Demo](https://img.shields.io/badge/demo-live-5e6ad2?style=flat-square)](https://grab-them-all.shariflab.my)
[![Stack](https://img.shields.io/badge/stack-React%20%7C%20ASP.NET%20Core%20%7C%20GCP-8a8f98?style=flat-square)](#tech-stack)

---

## The problem

On Langkawi, the ferry is one of the most important ways for visitors and locals to travel on and off the island. For **Grab drivers**, inbound and outbound ferry windows are a **high-demand period** — a reliable source of trips when passengers need rides to or from the terminal.

The gap: there was **no simple way to see ferry timings** without manually visiting the [Langkawi Ferry Line](https://ticket.langkawiferryline.com/) website, checking schedules trip by trip, and mentally calculating whether a run was still worth accepting.

Drivers needed answers fast:

- When does the next ferry leave?
- When will an inbound ferry actually arrive?
- If I accept a job now, can I still reach the terminal in time?
- Which sailing should I prioritise before the window closes?

---

## The solution

**Ferry & Flight PWA** aggregates Langkawi ferry timetables into a mobile-first app that drivers can install on their home screen. It:

1. **Scrapes and caches** official ferry timetables (3 days, all major routes) so data is always one tap away
2. **Estimates ferry arrival windows** for inbound sailings (Kedah/Perlis → Langkawi)
3. **Calculates driver timing** from the driver's **current GPS location** to Langkawi ferry terminal
4. Shows **Yes / No** indicators — can you still make a trip in time?
5. Surfaces **leave-by times**, terminal deadlines, and **priority alerts** when a sailing is approaching

No account required. Open the app, enable location, and decide in seconds whether a Grab order is worth taking.

**Live app:** [https://grab-them-all.shariflab.my](https://grab-them-all.shariflab.my)

---

## Key features

| Feature | What it does |
|---|---|
| **3-day schedule grid** | Kedah ↔ Langkawi and Perlis ↔ Langkawi, inbound and outbound |
| **Smart caching** | Server-side cache (30 min) with stale fallback if the ferry site is slow |
| **Drive-time estimation** | OpenRouteService road routing, with haversine fallback |
| **Driver Yes/No** | Per-trip indicator based on your location and sailing deadlines |
| **Inbound arrival windows** | Estimated ferry arrival range after departure |
| **Outbound terminal timing** | “Be around terminal” 1 hour before departure; job window until sailing time |
| **Priority alerts** | In-app toasts and optional push notifications for urgent trips |
| **Installable PWA** | Add to home screen on iOS/Android; offline schedule cache |
| **Responsive UI** | Optimised for phones in the car; full layout on desktop |

---

## How it works

```
Langkawi Ferry Line website
        │
        ▼  scrape + cache (ASP.NET Core API)
   REST API (/api/schedules/ferry)
        │
        ▼  nginx proxy (same origin)
   React PWA  ◄── GPS location
        │
        ▼
  Yes/No · leave-by · alerts per trip
```

1. The **backend** fetches and parses the public ferry timetable, caches it, and exposes a JSON API
2. The **frontend PWA** loads schedules and requests travel time from the driver's coordinates
3. **Business logic** applies route-specific rules (inbound arrival windows vs outbound terminal deadlines)
4. The driver sees actionable timing on every trip slot — not just raw departure times

---

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, vite-plugin-pwa |
| **Backend** | ASP.NET Core 10, HtmlAgilityPack, IMemoryCache |
| **External APIs** | Langkawi Ferry Line (scraped), OpenRouteService (optional) |
| **Infrastructure** | Docker, nginx, Google Cloud Run, Artifact Registry |
| **CI/CD** | GitHub Actions |
| **DNS / SSL** | Cloudflare + custom domain |

**Architecture:** Monorepo — two Cloud Run services (API + static web with nginx reverse proxy).

---

## Project structure

```
grab-them-all/
├── backend/FerryFlight.Api/     # Scraper, cache, travel-time API
├── frontend/                    # React PWA
├── documentation/               # Step-by-step project docs (start here to learn)
├── .github/workflows/           # CI/CD pipeline
├── docker-compose.yml           # Local full-stack
└── DEPLOYMENT.md                # GCP setup guide
```

---

## Documentation

Full learning guide (architecture, data flow, every file, deploy, DNS, best practices):

**→ [documentation/README.md](documentation/README.md)**

Read docs **1 → 11** in order for a structured walkthrough of the codebase.

---

## Quick start

### Local development

```bash
# Backend (terminal 1)
cd backend/FerryFlight.Api && dotnet run
# → http://localhost:5000

# Frontend (terminal 2)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Docker

```bash
cp .env.example .env
docker compose up --build
# Web: http://localhost:8081  |  API: http://localhost:8080
```

### Deploy

Push to `main` — GitHub Actions deploys to Google Cloud Run. See [DEPLOYMENT.md](DEPLOYMENT.md).

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schedules/ferry` | 3 days of ferry schedules (cached) |
| `GET` | `/api/estimation/travel-times?latitude=&longitude=` | Drive time to Langkawi terminal |

---

## Roadmap

- [x] Ferry schedules (3 days, 4 routes)
- [x] Driver location + travel estimation
- [x] Yes/No and priority alerts
- [x] PWA install + offline cache
- [x] Production deploy (GCP + custom domain)
- [ ] Flight module (placeholder in UI)

---

## Author

Built as a portfolio project to solve a real operational problem for Langkawi e-hailing drivers — turning fragmented ferry timetable data into **actionable timing decisions** at the moment orders spike.

**Repository:** [CodeBySharif/grab-them-all](https://github.com/CodeBySharif/grab-them-all)
