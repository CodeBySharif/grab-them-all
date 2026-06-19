# Ferry & Flight PWA — Documentation

Welcome. This folder explains the **grab-them-all** project step by step so you can understand the codebase, deployment, and design decisions even if you did not write the code yourself.

## What this app does

A **Progressive Web App (PWA)** for Langkawi ferry schedules. It:

1. Shows **3 days** of ferry times for 4 routes (Kedah/Perlis ↔ Langkawi).
2. Uses your **GPS location** to estimate drive time to Langkawi ferry terminal.
3. Shows **Yes/No** indicators — can you still make a trip in time?
4. Sends **priority alerts** (in-app toasts + optional push notifications) when trips are urgent.

**Live URLs (production):**

| Service | URL |
|---|---|
| Web (PWA) | https://grab-them-all.shariflab.my |
| API | https://grab-them-all-api.shariflab.my |

Flight schedules are planned but not built yet (placeholder in the UI).

---

## Reading order

Read the numbered files in order the first time. Later, use them as reference.

| # | File | Topic |
|---|---|---|
| 1 | [1.overview-and-tech-stack.md](./1.overview-and-tech-stack.md) | What the app is, tech stack, product stage |
| 2 | [2.monorepo-and-architecture.md](./2.monorepo-and-architecture.md) | Why monorepo, system diagram, request flow |
| 3 | [3.backend-structure-and-files.md](./3.backend-structure-and-files.md) | Every backend file explained |
| 4 | [4.backend-logic-and-data-flow.md](./4.backend-logic-and-data-flow.md) | Scraping, caching, travel-time API |
| 5 | [5.frontend-structure-and-files.md](./5.frontend-structure-and-files.md) | Every frontend file explained |
| 6 | [6.frontend-logic-and-data-flow.md](./6.frontend-logic-and-data-flow.md) | UI flow, driver logic, components |
| 7 | [7.pwa-mobile-and-responsive.md](./7.pwa-mobile-and-responsive.md) | PWA, install, mobile/desktop layout |
| 8 | [8.gcp-setup.md](./8.gcp-setup.md) | Google Cloud project setup |
| 9 | [9.cicd-pipeline.md](./9.cicd-pipeline.md) | GitHub Actions deploy pipeline |
| 10 | [10.custom-domain-and-dns.md](./10.custom-domain-and-dns.md) | Exabytes → Cloudflare → GCP |
| 11 | [11.best-practices-and-security.md](./11.best-practices-and-security.md) | Best practices and gaps to improve |

---

## Repo map (quick reference)

```
grab-them-all/
├── documentation/          ← You are here
├── backend/FerryFlight.Api/  ← ASP.NET Core API
├── frontend/                 ← React + Vite PWA
├── .github/workflows/        ← CI/CD
├── docker-compose.yml        ← Local full-stack
├── DEPLOYMENT.md             ← Original deploy guide (also see doc 8–10)
├── Ferry-Flight-PWA.md       ← Original product concept
└── README.md                 ← Quick start
```

---

## Learning tips

1. Start with **doc 1 and 2** for the big picture.
2. Read **doc 4 and 6** to understand how data moves — this is the core of the app.
3. Use **doc 3 and 5** as a file dictionary while browsing code.
4. Follow **doc 8 → 9 → 10** when you want to reproduce deployment.
5. Keep **doc 11** open for “what good looks like” on future projects.
