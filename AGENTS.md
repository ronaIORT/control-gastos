# AGENTS.md — Control de Gastos — v3.2

## Stack
- JavaScript vanilla (sin framework) + Vite 8 + Chart.js 4
- Persistencia en localStorage (sin backend, sin API calls)
- UI, comentarios e identificadores en **español**

## Comandos
| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor desarrollo Vite (abre navegador automáticamente) |
| `npm run build` | Build producción en `dist/` |
| `npm run preview` | Vista previa build producción |

No existen comandos de test, lint, typecheck ni format.

## Arquitectura
- **Entrypoint**: `index.html` -> `src/js/app.js` (ES module)
- **Enrutamiento SPA**: Cambio de secciones en memoria en `src/js/router.js` (sin URL/hash router)
- **Estado**: Pub/sub propio en `src/js/state.js` — `getState()`, `subscribe(fn)`, `notify()` en cada mutación
- **Persistencia**: `src/js/storage.js` — claves localStorage con prefijo `fp_`: `fp_transactions`, `fp_budgets`, `fp_goals`, `fp_categories`, `fp_initialized`
- **Componentes**: `src/js/components/` — cada uno exporta `render(container)`
- **Gráficos**: `src/js/components/charts.js` — envoltorio Chart.js; se llama `destroyAllCharts()` antes de cada navegación
- **Service worker**: `public/service-worker.js` — cache name `control-gastos-v3.2`; precachea index, iconos, manifest

## Comportamientos clave
- Primera carga (sin `fp_initialized`): genera 4 meses de transacciones de ejemplo + presupuestos + 2 metas de ahorro
- `clearAllData()` en `state.js` vacía todo y establece `fp_initialized=true` para evitar regeneración
- 12 categorías fijas no eliminables definidas en `src/js/storage.js:13` (9 tipo gasto + 3 tipo ingreso); algunas son editables
- IDs de transacciones: `tx_<timestamp>_<random9>` generados en `state.js`
- Fotos de recibos como base64 en localStorage (comprimidas via `utils/imageCompressor.js`)
- Formateo de moneda via `utils/format.js` `formatBs()` (Bolívares)
- Vite config `server.open: true` — abre navegador automáticamente al hacer `dev`
- `vite.config.js` usa `base: '/control-gastos/'` cuando `GH_PAGES=true` (para GitHub Pages deploy)
- Cada modificación sustancial incrementa el **patch** de la versión (semver). Actualizar los 4 archivos donde aparece: `package.json` → `version`, `package-lock.json` → `version` (root + `packages[""].version`), `public/service-worker.js` → `CACHE` (`control-gastos-v{X.Y.Z}`), `src/js/components/acercade.js` → texto `Versión {X.Y.Z}`

## CI / Deploy
- Workflow en `.github/workflows/deploy.yml`: `npm ci` + `npm run build` con `GH_PAGES=true` -> upload `dist/` a GitHub Pages
- Solo se ejecuta en push a `main`

## PWA
- Iconos en `public/icon-192.png` y `public/icon-512.png` (existen, funcionales)
- `public/manifest.json` referencia `icon-*.png` (rutas relativas al root)
- Service worker registrado desde `app.js` (no externamente); funciona offline post-carga inicial
- `index.html` referencia `icon-192.png` como favicon

## Gotchas
- `src/assets/icons/` está vacío — no se usa; los iconos reales están en `public/`
- No hay archivos `.env` ni variables de entorno (excepto `GH_PAGES` en CI)
- Chart.js es dependencia npm (no CDN, pese a que README diga CDN)
- Vite config es mínimo — sin plugins CSS/postcss
