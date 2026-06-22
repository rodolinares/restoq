# Restoq — Home Inventory Tracker

Track what you buy, predict when you'll run out.

Mobile-first PWA. All data stays local — no backend, no sign-up.

## Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| Bundler / Dev Server | Vite 8                                  |
| UI Framework         | React 19 + TypeScript 6.0               |
| Styling              | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| Animations           | tw-animate-css                          |
| Toasts               | sonner                                  |
| State Management     | Zustand 5 (persisted to localStorage)   |
| Icons                | Lucide                                  |
| Font                 | Geist Variable                          |
| PWA                  | vite-plugin-pwa + Workbox               |

## Getting Started

```sh
pnpm install
pnpm dev
```

Open URL Vite prints (usually `http://localhost:5173/restoq/`).

## Features

- **Products** — register items with category, unit, and target stock level.
- **Stock snapshots** — count what you have; consumption rate derived from real deltas between counts.
- **Purchase logging** — optional; enriches prediction when logged.
- **Consumption predictions** — each product card shows projected stock, daily usage, days until empty. Confidence: none (<2 snapshots), low (2), medium (3–4), high (5+).
- **Low-stock alerts** — products at or below target stock appear in Alerts tab with Overdue / Low badges.
- **Shopping list** — auto-generated from alert products, editable quantities, copy to clipboard.
- **Category filter** — filter inventory by pantry, cleaning, bathroom, pets, other.
- **Browser notifications** — permission prompt on first alert; sends notification when alert state changes (deduplicated).
- **Search** — filter products by name.
- **Dark mode** — respects `prefers-color-scheme`, togglable, persisted.
- **PWA** — installable, works offline, auto-updating service worker.
- **Reset all data** — clear everything from Alerts tab (confirms first).

## Commands

| Command        | Description                                     |
| -------------- | ----------------------------------------------- |
| `pnpm dev`     | Vite dev server                                 |
| `pnpm build`   | `tsc -b && vite build` (type-check then bundle) |
| `pnpm test`    | Vitest run                                      |
| `pnpm lint`    | ESLint 10 (flat config)                         |
| `pnpm format`  | Prettier on `src/**/*.{css,ts,tsx}`             |
| `pnpm preview` | Vite preview                                    |
| `pnpm deploy`  | Build + deploy to GitHub Pages                  |

## Architecture

### Data Model

- **Product** — `id`, `name`, `category`, `unit`, `targetStock`, `createdAt`
- **StockSnapshot** — `id`, `productId`, `quantity`, `takenAt`
- **Purchase** — `id`, `productId`, `quantity`, `purchasedAt`

Products are explicitly registered. Stock is measured via snapshots, not inferred from purchase history alone.

### State

Zustand store (`useInventoryStore`) with `persist` middleware writes to `localStorage` key `restoq-inventory`.

### Prediction Engine

`predictProduct` in `src/lib/prediction.ts` derives consumption rate from the difference between consecutive stock snapshots divided by the time between them — reflecting actual consumption. Purchases between snapshots are added back to calculate true consumption. Projects current stock and days until empty. Confidence levels: none (0–1 snapshots), low (2), medium (3–4), high (5+). Negative stock clamped to 0; daysUntilEmpty ≤ 0 triggers overdue.

### Notifications

`useNotifications` hook compares current alerts against previously sent ones (`restoq-notified-alerts` in localStorage) to avoid duplicate notifications. Sends via service worker if available, falls back to `new Notification()`.
