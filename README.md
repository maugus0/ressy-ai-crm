# Ressy AI CRM Admin (Frontend)

React + Vite + TypeScript admin dashboard for Ressy AI CRM. Uses **React Router** for navigation, **TanStack Query** for server state, and **shadcn/ui (Radix)** + **Tailwind CSS** for UI.

## 🚀 What’s in the app

- **Auth flow**: `/login` → protected `/dashboard/*` routes
- **Dashboard sections**: Calls, Callers, Reservations, Orders, Menu, FAQs, Settings
- **API integration**: configurable via Vite env vars (`VITE_API_BASE_URL`, `VITE_API_VERSION`)

## ✅ Prerequisites

- **Node.js**: 18+
- **npm**: (project uses `package-lock.json`)

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

- **`VITE_API_BASE_URL`**: base URL for the backend (dev fallback is `http://localhost:5001`)
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

Protection is handled by `src/components/ProtectedRoute.tsx` and layout by `src/components/DashboardLayout.tsx`.

## 📁 Project structure (current)

```
src/
  components/
    DashboardLayout.tsx
    ProtectedRoute.tsx
    Sidebar.tsx
    ui/                # shadcn/ui components
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
    NotFound.tsx
  config/
    env.ts
  lib/
    api/
    utils.ts
  contexts/
  hooks/
  services/
  main.tsx
  App.tsx
```

## 📜 Scripts

- **`npm run dev`**: start dev server
- **`npm run build`**: production build to `dist/`
- **`npm run preview`**: preview production build locally
- **`npm run lint`**: eslint
- **`npm run format`** / **`npm run format:check`**: prettier
- **`npm run test`** / **`npm run test:ci`**: vitest

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
- **Vite 5**
- **Tailwind CSS**
- **shadcn/ui** + **Radix UI**
- **React Router v6**
- **TanStack Query**
- **Vitest**
