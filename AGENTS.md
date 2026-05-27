# RestoQ — Project Brief

## Overview

RestoQ is a mobile-first Progressive Web App designed to help users maintain home inventory and avoid stockouts on groceries and household essentials. The core value proposition is proactive, threshold-based notifications that alert users when a tracked item is running low, prompting timely restocking.

## Core Features (Phase 1)

- **Manual inventory input** — users log purchases and current stock levels.
- **Stock-level tracking** — the app monitors quantities and triggers low-stock notifications.
- **Predictive restocking (foundational)** — by accumulating restocking history per product, the app will build a consumption pattern model to forecast when a given item is likely to run out.

## Stack

| Layer                | Technology               |
| -------------------- | ------------------------ |
| Bundler / Dev Server | Vite                     |
| UI Framework         | React + TypeScript       |
| Styling              | Tailwind CSS + shadcn/ui |
| State Management     | Zustand                  |

## Phase 1 Scope & Constraints

This phase is intentionally front-end only, with all state persisted locally — no backend, no auth, no network dependency.

## Architecture Notes

- The **prediction engine** (consumption pattern model) must be implemented as a **replaceable module**. This ensures a clean handoff to a backend service in a future phase without requiring a rewrite of surrounding logic.
- There is no API layer in Phase 1. Any service calls should be abstracted behind an interface now to make the Phase 2 migration straightforward.

## Out of Scope (deferred to Phase 2+)

- Backend services
- Cloud sync
- User accounts
- Server-side ML for consumption prediction
