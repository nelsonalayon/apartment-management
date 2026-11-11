# Memoria del proyecto

## Estado actual
- MVP dashboard cuota inicial conectado a **MySQL real** (`sistema_propiedad`, Workbench) vía `mysql2` — sin API REST ni fallback a mock. Últimos commits: `feat` conexión MySQL y `docs` plantilla LEARNINGS enseñable.
- Datos al día hasta oct-2026 (10 nov 2026): 5 cuotas marcadas pagadas + 4 pagos insertados siguiendo la convención existente (fecha_pago = vencimiento, idperson = quien_debe_pagar, valor = valor_cuota); el pago 36 quedó consistente con su cuota 77. Backup previo en `backups/` (gitignored).
- Tests Vitest: **30/30** (`pnpm test`) — cálculos (incl. extras), formato, integridad de fixtures (incl. `codigo` corto).
- Códigos cortos (11 nov 2026): badge/filtros muestran **"Apto 101"/"Apto 202"** (no la referencia larga). Campo `codigo` en `Apartment`, derivado en `data/db.ts` (`CODIGOS_CORTOS` por nombre); `id`/`apartmentId` siguen siendo la referencia larga (clave de unión).
- `LEARNINGS.md`: plantilla "enseñable" en español (título-pregunta + "Por qué pasa" + "En el proyecto" + "Prueba" + "Ver más" con enlaces oficiales verificados).
- Modo oscuro: 3 estados con `next-themes`, default **oscuro**, botón en Header. `formatCOP` corrige el NBSP de Intl → "$75.000.000".
- Rediseño visual (11 nov 2026, skill `frontend-design`): hero con avance general (`text-6xl`) + franja hairline de stats; Geist como única `--font-sans` (Inter eliminado); `lang="es"`; sin sombras; badge "Datos reales"; `motion-reduce` en barras y skeleton.

## Decisiones importantes (y por qué)
- **Datos:** `data/db.ts` (pool mysql2 + 4 queries) es la única fuente en runtime; `data/mock-data.ts` queda solo como fixture de tests. Los componentes no se tocaron (mismos tipos `lib/types.ts`).
- **`pagos_adicionales` SÍ cuentan** en el avance (decisión del usuario, con tope existente: avance ≤100%, pendiente ≥0). Extras también en `UserSummary.totalPagado` para que suma usuarios = total general. → toca `getApartmentSummary/getUserSummary/getGeneralSummary` con param `extras`.
- **`estado='vencida'` → se muestra `pendiente`** (0 filas hoy; anotado en `data/db.ts`).
- **Next 16 Cache Components:** datos frescos por request → `DashboardContent` async detrás de `<Suspense>` + streaming. NO `'use cache'`, NO prerender con BD en build. Leído de `node_modules/next/dist/docs/` (06-fetching-data, 08-caching).
- **`dateStrings: true`** → fechas "YYYY-MM-DD" directas para `lib/format.ts`.
- `mysql2` es la 1ª excepción justificada a "sin dependencias" (junto a `next-themes`).
- **Rediseño sin dependencias nuevas:** Geist ya estaba importada en `layout.tsx` (solo se rewiró a `--font-sans`); semántica de color constante: emerald = pagado, ámbar = pendiente (siempre con variante `dark:`).

## Errores a evitar
- **PowerShell `node -e` rompe las comillas del SQL** → escribir `scripts/*.mjs` y correr `node scripts/x.mjs` (hay `scripts/db-diagnostic.mjs`).
- En `cuotas` la columna es **`valor_cuota`** (no `valor`).
- **`pool.query<T>` de mysql2 exige `T extends QueryResult`** → los tipos de fila deben `extends RowDataPacket` (si no, falla el build con TS2344).
- `.env.local` (credenciales) NUNCA a git ni a AGENTS.md/MEMORY.md/LEARNINGS.md.
- Hidratación: `<html>` necesita `suppressHydrationWarning`; en el toggle, todo lo que depende del tema espera a `montado` (`useSyncExternalStore`, no `useState`+effect → `react-hooks/set-state-in-effect`).
- Asumir formato de Intl sin probar: es-CO da NBSP en "$" y fecha "15 de ene de 2026".
- Matar el puerto 3000 antes de `pnpm build`. El bloque `nextjs-agent-rules` lo re-escribe `next dev`: no quitarlo del diff.
