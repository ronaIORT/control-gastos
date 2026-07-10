# AGENTS.md — Control de Gastos

## Stack
- Vanilla JS (no framework) + Vite 8 + Chart.js 4
- localStorage persistence (no backend, no API calls)
- All UI text, comments, and identifiers in **Spanish**

## Commands
| Command | Action |
|---------|--------|
| `npm run dev` | Vite dev server (auto-opens browser) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

No test, lint, typecheck, or format commands exist.

## Architecture
- **Entrypoint**: `index.html` -> `/src/js/app.js` (ES module)
- **SPA routing**: In-memory section switching in `src/js/router.js` (no URL router, no hash)
- **State**: Custom pub/sub in `src/js/state.js` — `getState()`, `subscribe(fn)`, `notify()` on every mutation
- **Persistence**: `src/js/storage.js` — localStorage keys prefixed `fp_`: `fp_transactions`, `fp_budgets`, `fp_goals`, `fp_categories`
- **Components**: `src/js/components/` — each exports a `render(container)` function
- **Charts**: `components/charts.js` — wraps Chart.js; `destroyAllCharts()` called before each navigation
- **Service worker**: `service-worker.js` — precaches only CSS files; cache name `control-gastos-v1`

## Key Behaviors
- On first load (empty localStorage), auto-generates 4 months of sample transactions + budgets + 2 savings goals
- 9 built-in non-deletable categories defined in `src/js/storage.js`
- Transaction IDs: `tx_<timestamp>_<random9>` generated in `state.js`
- Receipt photos stored as base64 in localStorage (compressed via `utils/imageCompressor.js`)
- Currency formatting via `utils/format.js` `formatBs()` (Bolivares)
- Vite config has `server.open: true` — browser opens automatically on `dev`

## PWA
- `public/manifest.json` references `src/assets/icons/icon-192.png` — **file does not exist** (broken PWA icon)
- Service worker registers externally (not from app.js); works offline after initial load

## Gotchas
- `vite.config.js` is minimal — no plugins, no CSS/postcss config
- No icon files in `src/assets/icons/` — manifest references broken paths
- No `.env` files or environment variable usage anywhere
- Chart.js is an npm dependency (not CDN, despite README saying CDN)
