# Ferry & Flight PWA

A Progressive Web App for checking ferry schedules (Langkawi Ferry Line) with a future flight module. Built as a **monorepo** with React + Vite (frontend) and ASP.NET Core (backend).

## Monorepo structure

```
grab-them-all/
├── .github/workflows/deploy.yml   # CI/CD → Google Cloud Run
├── backend/FerryFlight.Api/       # ASP.NET Core API
├── frontend/                      # React + Vite PWA
├── docker-compose.yml             # Local full-stack Docker
├── DEPLOYMENT.md                  # GCP + GitHub setup guide
├── Ferry-Flight-PWA.md
└── DESIGN-linear.app.md
```

## Quick start (local dev)

### Backend API

```bash
cd backend/FerryFlight.Api
dotnet run
```

Runs at **http://localhost:5000**.

### Frontend PWA

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5173** (proxies `/api` to backend).

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL |
|---|---|
| Web (PWA) | http://localhost:8081 |
| API | http://localhost:8080 |

## Deploy to Google Cloud Run

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full setup:

1. Create GCP project + Artifact Registry
2. Add GitHub secrets (`GCP_PROJECT_ID`, `GCP_SA_KEY`)
3. Push to `main` — CI/CD deploys two Cloud Run services automatically

## API endpoints

- `GET /api/schedules/ferry` — 3 days of cached ferry schedules
- `GET /api/estimation/travel-times?latitude=&longitude=` — drive time to Langkawi terminal

## Features

- Scrapes ferry schedules for 3 days from Langkawi Ferry Line
- 30-minute server-side cache with stale fallback
- Responsive 2×2 route grid with fixed 5-trip slots per route
- Driver-focused arrival estimation (Yes/No + priority alerts)
- PWA with offline schedule caching

## Configuration

| Setting | Location | Default |
|---|---|---|
| Cache TTL | `FerrySchedule:CacheMinutes` | 30 |
| CORS origins | `Cors:Origins` | localhost (dev) |
| OpenRouteService key | `OpenRouteService:ApiKey` | optional |
| Web → API proxy | `BACKEND_URL` env (Docker/Cloud Run) | — |

### OpenRouteService API key (optional)

```bash
cd backend/FerryFlight.Api
dotnet user-secrets set "OpenRouteService:ApiKey" "YOUR_API_KEY"
```

Or set `OPENROUTESERVICE_API_KEY` in GitHub secrets for Cloud Run deploy.
