# Ressy AI CRM (Client Dashboard)

React + Vite + TypeScript client dashboard for Ressy AI CRM. Restaurant owners use it to manage reservations, orders, menu, FAQs, and settings. Uses **React Router** for navigation, **TanStack Query** for server state, and **shadcn/ui (Radix)** + **Tailwind CSS** for UI.

## 🚀 What’s in the app

- **Auth flow**: `/login` → protected `/dashboard/*` routes
- **Dashboard sections**: Dashboard, Calls, Callers, Reservations, Orders, Menu, FAQs, Settings, Escalations, Order Events, Reservation Events
- **Settings**: Restaurant info, weekly operating hours, reservation capacity/timing, agent capabilities (orders, reservations, FAQs toggles)
- **Real-time**: SSE (Server-Sent Events) for live updates
- **API integration**: configurable via Vite env vars (`VITE_API_BASE_URL`, `VITE_API_VERSION`); production fallback: `https://voice.ressy.ai`

## ✅ Prerequisites

- **Node.js**: 20+
- **npm**: 10+ (project uses `package-lock.json`; see `.nvmrc`)

## 🛠️ Setup

Install deps:

```bash
npm ci
```

Create your local env file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` as needed.

Start dev server:

```bash
npm run dev
```

Dev runs on `http://localhost:8080` (see `vite.config.ts`).

## 🔐 Environment variables

The app reads env vars via Vite (`import.meta.env`) and centralizes them in `src/config/env.ts`.

- **`VITE_API_BASE_URL`**: base URL for the backend (dev fallback: `https://voice.ressy.ai`; production fallback if unset: `https://voice.ressy.ai`)
- **`VITE_API_VERSION`**: defaults to `v1`

## 🧭 Routing (React Router)

Routes are defined in `src/App.tsx`:

- **Public**
  - `/login`
- **Protected**
  - `/dashboard` (index)
  - `/dashboard/calls`
  - `/dashboard/callers`
  - `/dashboard/reservations`
  - `/dashboard/orders`
  - `/dashboard/menu`
  - `/dashboard/faqs`
  - `/dashboard/settings`
  - `/dashboard/escalations`
  - `/dashboard/order-events`
  - `/dashboard/reservation-events`

Protection is handled by `src/components/ProtectedRoute.tsx` and layout by `src/components/DashboardLayout.tsx`.

## 📁 Project structure

```
src/
  components/
    CollapsibleSection.tsx
    DashboardLayout.tsx
    ErrorBoundary.tsx
    ProtectedRoute.tsx
    Sidebar.tsx
    UiOnlyNotice.tsx
    ui/                # shadcn/ui (command, popover, timezone-combobox, etc.)
  config/
    env.ts
  contexts/
    AuthContext.tsx
    SSEContext.tsx
  hooks/
  lib/
    api/
      client.ts
      endpoints.ts
    utils/
      time.ts          # time + operating hours utilities
      timezone.ts      # timezone conversions
      format.ts, csv.ts, json.ts, notification-sounds.ts, tokenRefresh.ts
      utils.ts
  pages/
    Login.tsx
    Dashboard.tsx
    Calls.tsx
    Callers.tsx
    Reservations.tsx
    Orders.tsx
    Menu.tsx
    FAQ.tsx
    Settings.tsx
    Escalations.tsx
    OrderEvents.tsx
    ReservationEvents.tsx
    NotFound.tsx
  services/
    auth.ts, restaurant.ts, reservations.ts, orders.ts, menu.ts, faq.ts, calls.ts, callers.ts, sse.ts, analytics.ts
  types/
    api.types.ts
    auth.types.ts
  main.tsx
  App.tsx
```

## 📜 Scripts

- **`npm run dev`**: start dev server
- **`npm run build`**: production build to `dist/`
- **`npm run build:gh-pages`**: build with GitHub Pages base path
- **`npm run preview`**: preview production build locally
- **`npm run lint`**: ESLint
- **`npm run format`** / **`npm run format:check`**: Prettier
- **`npm run test`** / **`npm run test:ci`** / **`npm run test:watch`**: Vitest
- **`npm run deploy`**: build for GitHub Pages and deploy via `gh-pages`

## 🌍 GitHub Pages / base path

This repo supports GitHub Pages by setting a base path:

- `vite.config.ts` uses `GITHUB_PAGES=true` to build with base `"/ressy-ai-crm/"`
- `src/App.tsx` sets `BrowserRouter basename` at runtime when hosted under `/ressy-ai-crm`

Build for GitHub Pages:

```bash
npm run build:gh-pages
```

## 🐳 Docker (static hosting via Nginx)

Build and run:

```bash
docker build -t ressy-ai-crm-admin .
docker run -p 80:80 ressy-ai-crm-admin
```

Nginx is configured in `nginx.conf` to support SPA routing (`try_files ... /index.html`).

## 📦 Tech stack

- **React 18**, **TypeScript**
- **Vite 7**
- **Tailwind CSS**
- **shadcn/ui** + **Radix UI**
- **React Router v6**
- **TanStack Query**
- **Sonner** (toast notifications)
- **Vitest**
