# Ferry & Flight PWA Concept

## Overview
A Progressive Web App (PWA) built with **React + Vite**, designed to be mobile‑friendly and installable.  
The app helps users check ferry (and later flight) schedules, estimate arrival times, and determine if they can reach the station in time.

---

## Layout & Navigation
- **Top Fixed Bar**
  - Left: **Day** (e.g., THU)
  - Right: **Date** (e.g., 18 JUN 2026)
  - Below: **Option Selector** (Ferry | Flight)
    - Always visible, fixed at the top.
    - Content changes based on selected option.

---

## Ferry Module (Phase 1)
- **Data Source**
  - Scrape ferry schedules for **3 days** from Langkawi Ferry Line.
  - Cache results in backend (ASP.NET Core Web API with MemoryCache).
- **Display**
  - **Desktop:** 3 days shown side‑by‑side.
  - **Mobile:** 3 days stacked vertically.
- **Grouping**
  - Each day wrapped in its own **Card** for readability.
  - Card contains:
    - Route (e.g., Langkawi → Kuala Kedah)
    - Departure times
    - Vessel names
- **Reusable Components**
  - `TopBar` → Day + Date + Option Selector
  - `OptionSelector` → Ferry | Flight toggle
  - `ScheduleCard` → One day’s schedule
  - `TripItem` → Single trip (time + vessel)
  - `ScheduleGrid` → Layout manager (side‑by‑side vs stacked)

---

## Flight Module (Future Phase)
- Similar structure to Ferry.
- Data source: Flight API (e.g., Skyscanner, Amadeus).
- Display grouped by day.

---

## Mobile‑Friendly Features
- Responsive layout with TailwindCSS.
- Cards stack vertically on small screens.
- Installable via **vite-plugin-pwa**.
- Offline caching of last fetched schedules.

---

## Next Steps
1. Build backend API in ASP.NET Core to scrape and cache ferry schedules.
2. Create React components (`TopBar`, `OptionSelector`, `ScheduleCard`, `TripItem`).
3. Implement responsive layout (`ScheduleGrid`).
4. Integrate with backend API.
5. Add PWA features (offline support, install prompt).
6. Extend to Flight module later.
