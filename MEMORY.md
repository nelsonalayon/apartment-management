# Memoria del proyecto

## Estado actual
- MVP dashboard cuota inicial conectado a **MySQL real** (`sistema_propiedad`, Workbench) vía `mysql2` — sin API REST ni fallback a mock.
- **Ruta A completada (A1-A5, 18-19 nov 2026): la app está en internet** con URL estable `https://desktop-vt0tpeg.tail3c231e.ts.net` y **arranque automático** (tarea Windows `ElementalApp-Publica`). Guía de operación en `README.md`. Verificado: 46/46 tests, build, lint, E2E 15/15 y pruebas del usuario en celular con datos móviles ✅.
- Datos al día hasta oct-2026 (10 nov 2026): 5 cuotas pagadas + 4 pagos con la convención existente (fecha_pago = vencimiento, idperson = quien_debe_pagar, valor = valor_cuota); backup previo en `backups/` (gitignored).
- Tests Vitest: **67/67** — cálculos (incl. extras), `lib/installments.ts`, formato, integridad de fixtures, auth y rate limiting.
- Login de los 4 usuarios: PIN de 4 dígitos con hash **scrypt** en `persona.pin_hash` (`scripts/set-pins.mts`, `--reset` regenera; PINs solo se imprimen una vez). Regla 4 de AGENTS.md admite E2E HTTP como alternativa al MCP de DevTools.
- Códigos cortos: badge/filtros muestran **"Apto 101"/"Apto 202"** (`codigo` derivado en `data/db.ts`; `id`/`apartmentId` siguen siendo la referencia larga). `LEARNINGS.md` con plantilla en español (pregunta + "Por qué pasa" + "En el proyecto" + "Prueba" + "Ver más").
- Modo oscuro: 3 estados con `next-themes`, default **oscuro**. `formatCOP` corrige el NBSP de Intl → "$75.000.000". Rediseño (11 nov): Geist única `--font-sans`, `lang="es"`, sin sombras, `motion-reduce`.
- **Metodología** (en `AGENTS.md`): escala 1-10 con tope 10; divisiones en etapas obligatorias desde 6; 10 = ALERTA; ejecución etapa a etapa (verificar → aprobación → commit).
- **Spec 001 — página por apartamento** (`specs/001-apartment/spec.md`, 19 nov): aprobada y **revisada como QA (41 hallazgos → 30 decisiones aplicadas)**. Reglas: dirección = código exacto (101/202, resto → no encontrado); extras **al principio** de la tabla (fecha asc., concepto en columna Cuota, siempre visibles; filtro solo toca cuotas); filtro único Todas/Pagadas/Pendientes (vencida = pendiente); resumen = avance% + pagado + pendiente; total usuario = cuotas + extras; precedencias: sin sesión → login, BD caída → RF-11 (nunca "no encontrado"); estados vacíos solo como defensa (no habrá más apartamentos). **12 RF/28 CA, 9 HU, 9 RNF (incl. accesibilidad), 14 casos límite, 15 decisiones, 0 dudas.** **Plan generado** (`specs/001-apartment/plan.md`, 378 línas, 10 secciones, tests Vitest, 0 preguntas abiertas, ruta `/apartment/[codigo]`) y **tasks** (`specs/001-apartment/tasks.md`, **40 tareas en 6 fases** con dependencias, "Hecho cuando" y matriz RF→tareas 12/12). Spec+plan commiteados (`522951c`), tasks commiteado (`52998e4`). **Implementación en curso etapa a etapa:** Fase 1 completa (**T01–T12**, commit `4d3e175`: `lib/installments.ts` nuevo + `getUserApartmentSummary` en `lib/calculations.ts` + tests, 67/67); siguiente: Fase Interfaz (T13+).
- **Constitución** (`docs/CONSTITUTION.md`, 19 nov): 6 principios innegociables con su verificación (stack simple **sin rigidez** — si hace falta, se propone la dependencia antes de instalarla —, spec>código, lógica/interfaz, tests>dependencias, datos protegidos, idioma); `docs/` trackeado en git (`fd5fdea`). Verificación principio 6: acentos = 0 en identificadores/nombres de archivo (en comentarios y textos sí hay, van en español). **Hallazgos de dependencias anotados, decidido NO tocar (19 nov):** `recharts` es código muerto (solo `components/ui/chart.tsx`, que nadie usa) y contradice la regla 6 de AGENTS; `shadcn` (CLI) está en `dependencies` en vez de dev.

## Ruta A — resumen de etapas (18-19 nov 2026)
- **A1 – app en internet:** quick tunnel de Cloudflare (efímero, caduca ~2 h) → **retirado**; binario en `%LOCALAPPDATA%\cloudflared\` como respaldo. E2E 15/15 + celular ✅.
- **A2 – login endurecido:** `lib/rate-limit.ts` (puro) → 5 fallos por usuario = bloqueo 5 min; durante el bloqueo ni el PIN correcto entra. Clave = userId (no IP). 6 tests; fuerza bruta 7/7 ✅.
- **A3 – URL estable:** **Tailscale Funnel** (gratis, `*.ts.net`), elegido sobre dominio propio Cloudflare (~$10-12/año, queda como mejora futura). `next.config.ts` → `allowedDevOrigins` (solo dev). E2E 15/15 en prod y dev ✅.
- **A4 – arranque automático:** tarea `ElementalApp-Publica` (inicio de sesión +1 min, oculta, 3 reintentos) → `scripts/start-public.ps1` (4 pasos, endurecido 21 nov): libera puerto 3000, espera Tailscale `Running` ≤90 s (**si no: abre `tailscale-ipn.exe`**), funnel + **sondeo `[sondeo]` PASS/FAIL** (local → URL pública), `pnpm start`. **Reinicio real del PC verificado ✅ (19 nov); E2E de tarea + PASS/PASS ✅ (21 nov).**
- **A5 – cierre documental:** MEMORY consolidado, guía de operación en `README.md`, LEARNINGS al día.

## Operación rápida (detalle en README)
- Tras iniciar sesión, la web sola vuelve en ~1 min; la URL **nunca cambia**.
- Parar: matar puerto 3000 + proceso `tailscale.exe funnel`. Relanzar: `Start-ScheduledTask -TaskName "ElementalApp-Publica"`.
- No levanta → `%TEMP%\elemental-start.log` (pasos) y `%TEMP%\elemental-pnpm.log` (errores).
- **URL pública caída con local OK** → Tailscale atorado (ver "Errores a evitar"); abrir `tailscale-ipn.exe` + relanzar `tailscale funnel 3000`.

## Decisiones importantes (y por qué)
- **Datos:** `data/db.ts` (pool mysql2 + 4 queries) es la única fuente en runtime; `data/mock-data.ts` solo como fixture de tests. Componentes intactos (mismos tipos `lib/types.ts`).
- **`pagos_adicionales` SÍ cuentan** en el avance (decisión del usuario; tope: avance ≤100%, pendiente ≥0). Extras también en `UserSummary.totalPagado` → `getApartmentSummary/getUserSummary/getGeneralSummary` con param `extras`.
- **`estado='vencida'` → se muestra `pendiente`** (0 filas hoy; anotado en `data/db.ts`).
- **Next 16 Cache Components:** datos frescos por request → `DashboardContent` async detrás de `<Suspense>`; NO `'use cache'`, NO prerender con BD en build (`node_modules/next/dist/docs/`).
- **`dateStrings: true`** → fechas "YYYY-MM-DD" directas para `lib/format.ts`. `mysql2` y `next-themes` = únicas excepciones a "sin dependencias".
- **Login:** Server Actions (sigue "sin API REST") + cookie HMAC-SHA256 httpOnly/SameSite=lax/30 días; `SESSION_SECRET` solo en `.env.local`; hashes scrypt en BD, errores genéricos.
- **Internet = Ruta A (túnel desde el PC):** gratis, sin migrar MySQL; contra: el PC debe estar encendido. **Tailscale Funnel** por URL estable gratis; dominio propio queda como mejora futura (habilitaría Cloudflare Access = PIN por correo). Cero config en el repo salvo `allowedDevOrigins` (solo dev).
- **Tarea programada en Windows, script en git:** si cambia la PC, el script viaja con el repo y la tarea se recrea con `Register-ScheduledTask` (entrada en `LEARNINGS.md`). Nunca commitear correos/tokens/PINs.
- **Archivos de agentes:** subir solo los propios (`opencode.json`, `.opencode/`, `skills-lock.json`, `.agents/skills/local-dates`).

## Errores a evitar
- PowerShell `node -e` rompe las comillas del SQL → `scripts/*.mjs` con `node scripts/x.mjs`.
- En `cuotas` la columna es **`valor_cuota`** (no `valor`). `pool.query<T>` exige `T extends QueryResult` (si no, TS2344 en build).
- `.env.local` NUNCA a git ni a AGENTS/MEMORY/LEARNINGS.
- Hidratación: `<html>` necesita `suppressHydrationWarning`; en el toggle, esperar a `montado` (`useSyncExternalStore`, no `useState`+effect).
- asumir formato de Intl sin probar (es-CO: NBSP en "$" y "15 de ene de 2026").
- Matar el puerto 3000 antes de `pnpm build`; **nunca `pnpm build` con `next start` sirviendo** (reescribe `.next` en caliente). Bloque `nextjs-agent-rules`: no quitarlo del diff.
- **Cache Components + auth:** `cookies()` fuera de `<Suspense>` = error de build; `Date.now()` en sesión = "unstable value" → `await connection()`; `InvariantError` de cookies en PPR → try/catch como "sin sesión".
- **Server Actions por fetch propio: solo `multipart/form-data`** (con urlencoded no se ejecuta).
- Reinicios del harness pueden corromper archivos recién escritos (UTF-16/nulos): verificar integridad.
- **`<select>` nativo en oscuro:** `<option>` necesita `bg-popover text-popover-foreground` (el `color-scheme: dark` no basta).
- MCP `chorme-devtools` (typo en `opencode.json`) puede no estar conectado → `/mcp` o reiniciar; mientras, regla 4 (E2E HTTP).
- **`EADDRINUSE :::3000`:** proceso node huérfano → `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`.
- **Proceso en background con `timeout` muere al agotarlo** (mató el funnel a los 30 min): servicios de larga duración **sin timeout**.
- `⚠ Missing origin header ...` en logs = scripts E2E sin cabecera `Origin`; aviso benigno.
- **Tarea no levanta tras reinicio:** mirar `%TEMP%\elemental-start.log` y `elemental-pnpm.log`. Causa ya vista: salida de pnpm a consola oculta se colgaba en el boot → redirigir a archivo + delay 1 min + esperar a Tailscale.
- **Tailscale atorado en `NoState` (21 nov):** servicio vivo pero "starting" eterno, logs en 0 bytes, `profile not found`; la tarea lanza el funnel igual y `*.ts.net` no resuelve (local OK). **Fix: abrir `tailscale-ipn.exe`** → estado `Running` sin re-login; después relanzar `tailscale funnel 3000`. Diagnóstico: `tailscale status --json` + `C:\ProgramData\Tailscale\Logs\` (con UAC). **Script endurecido ✅:** detecta el estado real, abre la GUI solo y loguea `[sondeo]` PASS/FAIL.
