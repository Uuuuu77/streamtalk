# StreamTalk

Real‑time, queue‑driven interactive audio sessions for streamers and audiences. Streamers host; viewers request the mic; a managed speaking queue, timers, and session analytics keep conversations flowing.

[![Deployed on Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](#) 
[![Built with Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](#) 
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](#)

## Why
Live audio can devolve into chaos without structure. StreamTalk supplies a lightweight moderation layer (queue + timers + roles) and a foundation for richer features (recording, transcription, analytics) while remaining simple to spin up locally.

## Core Features (Current)
- Create / end sessions (in‑memory store for now)
- Join / leave a speaking queue with position + estimated wait
- Basic streamer & viewer UI flows (Next.js App Router + Tailwind)
- Structured API endpoints under `/api/sessions` & `/api/queue`

## Planned (Roadmap)
- Persistent PostgreSQL storage + migrations
- WebSocket signaling + WebRTC peer audio
- Speaker selection & real‑time state broadcasts
- Recording + storage (S3/GCS) & optional transcription (Whisper)
- Moderation tooling (ban, priority, rate limits)
- Observability (metrics + structured logs) & authentication

## Tech Stack
- Framework: Next.js (App Router), React 19, TypeScript (strict)
- Styling/UI: Tailwind CSS + small headless component set
- Runtime APIs: Edge/Node (Next route handlers)
- State (server): In‑memory `SessionStore` & `QueueManager` (swap for DB layer later)
- Real‑Time (planned): WebSocket signaling → WebRTC audio

## Quick Start
```bash
pnpm install
pnpm dev   # start local dev server
```
Then open the root page and explore streamer / viewer flows. (Data resets on restart because storage is in‑memory.)

## API Snapshot
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/sessions/create` | Create a new session |
| GET  | `/api/sessions/:id` | Fetch session details |
| PUT  | `/api/sessions/:id` | Update session settings (name, etc.) |
| DELETE | `/api/sessions/:id` | End a session |
| POST | `/api/queue/:sessionId/join` | Join speaking queue |
| POST | `/api/queue/:sessionId/leave` | Leave queue |
| GET  | `/api/queue/:sessionId/status` | Current waiting list |

All responses are JSON. Authentication & validation are intentionally minimal at this stage.

## Architecture (Phase 0)
```
Next.js Route Handlers
	├─ sessionStore (in-memory) ← to be replaced by DB repo layer
	└─ queueManager (in-memory)
UI (App Router pages/components)
	└─ Calls REST endpoints (future: subscribe via WebSockets)
```

## Contributing / Next Steps
1. Introduce a persistence layer (Prisma + Postgres or direct SQL)
2. Add WebSocket gateway & event schema
3. Implement speaker selection + push updates
4. Layer in auth (JWT or NextAuth) & rate limiting
5. Add recording + upload pipeline

Small, focused PRs welcome. Keep the README concise: link out for deep docs once the surface grows.

## License
Not yet specified (add one before external contributions).

---
Originally scaffolded via v0.dev; now evolving toward a production‑ready real‑time audio platform.