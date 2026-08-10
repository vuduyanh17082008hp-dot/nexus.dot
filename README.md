# NEXUS

Premium browser gaming platform — discover games, play instantly, earn XP, unlock achievements, and climb leaderboards.

**Project path:** `C:\Users\DUY ANH\OneDrive\Desktop\nexus`

Cursor and VS Code open and edit this **same folder**. There are no Cursor-only runtime dependencies.

---

## Features

- Instant playable browser games (Phaser)
- Account auth via Supabase (email + Google OAuth-ready)
- Profiles, XP leveling, achievements, favorites
- Global + per-game leaderboards with time filters
- Cloud saves + local demo-mode persistence
- Game library with search, filters, sorting
- Cmd/Ctrl+K command palette search
- Player dashboard, settings, admin panel
- Installable PWA with safe static caching
- Responsive desktop + mobile controls

### Playable games

| Slug | Title | Genre |
|------|-------|-------|
| `neon-survivor` | Neon Survivor | Top-down survival shooter |
| `void-runner` | Void Runner | Endless runner |
| `cyber-breakout` | Cyber Breakout | Modern Breakout |

---

## Tech stack

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS 4 · Framer Motion · Lucide React
- Supabase (Auth, Postgres, RLS, Storage-ready)
- Phaser 4 · Zod · React Hook Form
- PWA manifest + service worker

---

## Folder structure

```
nexus/
├── .vscode/                 # Shared editor tasks, launch, extensions
├── public/                  # Icons, game art, manifest, SW
├── scripts/                 # Dev helpers
├── supabase/migrations/     # SQL schema + RLS + seeds
└── src/
    ├── app/                 # Routes, API handlers
    ├── components/          # UI, layout, gaming, auth, game shell
    ├── games/               # Phaser engines (shared + 3 games)
    ├── hooks/
    ├── lib/                 # supabase, auth, xp, validation, demo
    └── types/
```

---

## Open in Cursor or VS Code

Both editors use the identical project directory.

### Cursor

```bash
cursor "C:\Users\DUY ANH\OneDrive\Desktop\nexus"
```

Or **File → Open Folder** and select the `nexus` folder.

### VS Code

```bash
code "C:\Users\DUY ANH\OneDrive\Desktop\nexus"
```

Or **File → Open Folder** and select the same `nexus` folder.

You can switch editors freely — same files, same `npm` scripts, same Git history.

Recommended extensions (auto-suggested via `.vscode/extensions.json`):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript
- GitLens

VS Code / Cursor tasks (Terminal → Run Task):

- `dev` · `build` · `lint` · `typecheck`

---

## Installation

```bash
cd "C:\Users\DUY ANH\OneDrive\Desktop\nexus"
npm install
```

Copy environment template:

```bash
copy .env.example .env.local
```

Fill in Supabase values (optional for local gameplay demo mode).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | for auth/cloud | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for auth/cloud | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | recommended | e.g. `http://localhost:3000` |

Never put the **service role** key in client code or `NEXT_PUBLIC_*` vars.

Without Supabase configured, NEXUS runs in **demo mode**:

- All 3 games are fully playable
- Favorites / recent / high scores use `localStorage`
- Leaderboards show seeded demo data
- Auth mutations return clear “configure Supabase” responses

---

## Supabase configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Copy URL + anon key into `.env.local`
3. In Supabase SQL Editor, run:

   `supabase/migrations/20260315000000_init.sql`

   This creates tables, indexes, RLS policies, profile auto-create trigger, and seeds games + achievements.

4. Auth → URL configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
5. (Optional) Enable Google provider for OAuth
6. Promote an admin:

```sql
UPDATE profiles SET role = 'admin' WHERE username = 'your_username';
```

---

## Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Play immediately:

- [http://localhost:3000/play/neon-survivor](http://localhost:3000/play/neon-survivor)
- [http://localhost:3000/play/void-runner](http://localhost:3000/play/void-runner)
- [http://localhost:3000/play/cyber-breakout](http://localhost:3000/play/cyber-breakout)

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run format` | Prettier write |

---

## Game architecture

React owns platform UI (auth, library, overlays, APIs).  
Phaser owns rendering, physics, and the game loop.

```
src/games/
├── shared/          # GameShell, audio, input, save/score/pause managers, event bus
├── neon-survivor/
├── void-runner/
└── cyber-breakout/
```

`GameShell` dynamically imports each game boot function, reports load progress, and destroys the Phaser instance on route change to prevent leaks / double init.

---

## Building for production

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

---

## Deploying with Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`)
4. Deploy
5. Add the production URL to Supabase Auth redirect allow-list

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Games blank / Phaser SSR error | Games are client-only via dynamic import — hard refresh; check browser console |
| Auth fails | Verify `.env.local`, migration applied, redirect URLs |
| Middleware warning (Next 16) | Informational — `middleware.ts` still works; migrate to `proxy` later if desired |
| Leaderboard empty | Demo mode shows seed data; with Supabase, play a scored session while logged in |
| Type errors after pull | `npm install` then `npm run typecheck` |

---

## License

Private / proprietary unless otherwise stated.
