# Tasks 001 — Página independiente por apartamento

**Fuentes:** `specs/001-apartment/spec.md` (12 RF / 28 CA / 14 casos límite) y `specs/001-apartment/plan.md` (10 secciones).
**Reglas de este archivo:**
- Cada tarea dura **20–30 min como máximo**; si crece, se divide antes de empezarla.
- Cada tarea es **una única acción técnica verificable** con su línea **"Hecho cuando:"** (criterio objetivo).
- Ordenadas **por dependencias** (una tarea solo usa IDs anteriores).
- Los **PINs y credenciales nunca se escriben aquí** (se pasan por argumento al script E2E, como el `e2e-login.mjs` actual).
- Al final, la **matriz RF → tareas** prueba la cobertura: 12/12 RF.

---

## Fase: Preparación

- [ ] **T01 — Lectura previa obligatoria** `RF: — (proceso, constitución 2)`
  - **Depende de:** —
  - **Acción:** leer `AGENTS.md`, `docs/constitution.md`, `specs/001-apartment/spec.md` y `specs/001-apartment/plan.md` antes de tocar código.
  - **Hecho cuando:** los 4 documentos están leídos y no queda ninguna duda abierta (el plan §10 declara "Ninguna"); si surge una duda, se para y se resuelve antes de T02.

- [ ] **T02 — Baseline verde antes de cambios** `RF: — (proceso)`
  - **Depende de:** T01
  - **Acción:** ejecutar la verificación de referencia sin haber tocado nada.
  - **Hecho cuando:** `pnpm test` → 46/46; `pnpm lint` → 0 errores (17 warnings preexistentes); `pnpm build` → sin errores (con el puerto 3000 libre).

- [ ] **T03 — Confirmar cero dependencias nuevas** `RF: — (RNF-6, constitución 1)`
  - **Depende de:** T01
  - **Acción:** revisar que todo lo previsto en el plan se resuelve con `next/link`, `next/navigation`, React y shadcn ya instalados.
  - **Hecho cuando:** al cerrar la implementación `git diff -- package.json pnpm-lock.yaml` está vacío y el plan §8.13 se respeta (sin instalar nada; `recharts` sigue sin usarse).

## Fase: Lógica de negocio

- [ ] **T04 — Crear `lib/installments.ts` con `PaymentRow` y `buildPaymentRows`** `RF-6, RF-8`
  - **Depende de:** T01
  - **Acción:** crear el archivo con el tipo `PaymentRow` (unión discriminada por `tipo`: `"extra"` | `"cuota"`) y la función que ordena los extras primero (fecha ascendente) y después las cuotas (numero ascendente, número fijo).
  - **Hecho cuando:** `pnpm build` compila; `buildPaymentRows(cuotas, extras)` devuelve ese orden aunque los arrays lleguen desordenados; la función no llama `Date.now()` ni `new Date()` (plan §5).

- [ ] **T05 — Añadir `filterRowsByEstado` a `lib/installments.ts`** `RF-6, RF-8`
  - **Depende de:** T04
  - **Acción:** añadir la función pura que recibe `filas` + `EstadoFiltro` ("todas" | "pagada" | "pendiente") y devuelve las filas visibles.
  - **Hecho cuando:** `pnpm build` compila; con cualquier filtro las extras siguen presentes (CA-8.3) y solo se filtran las cuotas; una cuota "vencida" (que llega como "pendiente") entra en "Pendientes".

- [ ] **T06 — Añadir `getUserApartmentSummary` a `lib/calculations.ts`** `RF-4, RF-7`
  - **Depende de:** T01
  - **Acción:** añadir el tipo `UserApartmentSummary` y la función que suma **solo** las cuotas pagadas y **solo** los extras de ese usuario en **ese** apartamento, con `tienePagos` (≥1 cuota pagada o ≥1 extra).
  - **Hecho cuando:** `pnpm build` compila; devuelve `{ cuotasPagadas, totalPagado, tienePagos }`; ninguna función existente de `calculations.ts` cambia.

## Fase: Tests

- [ ] **T07 — Tests unitarios de `buildPaymentRows`** `RF-6, RF-8`
  - **Depende de:** T04
  - **Acción:** crear `lib/installments.test.ts` con los casos de orden y tipos.
  - **Hecho cuando:** `pnpm test` en verde con: ambos tipos → extras primero; extras entre sí por fecha ascendente; cuotas por `numero` ascendente con entrada desordenada; solo cuotas; solo extras; arrays vacíos.

- [ ] **T08 — Tests unitarios de `filterRowsByEstado`** `RF-6, RF-8`
  - **Depende de:** T05, T07
  - **Acción:** añadir al mismo archivo los casos del filtro.
  - **Hecho cuando:** `pnpm test` en verde con: "todas" muestra todo; "pagada"/"pendiente" filtran solo cuotas; **extras visibles con cualquier filtro**; filtro que deja 0 cuotas (caso 11); cuota "pendiente" incluida en "Pendientes" (caso 9).

- [ ] **T09 — Tests unitarios de `getUserApartmentSummary`** `RF-4, RF-7`
  - **Depende de:** T06
  - **Acción:** extender `lib/calculations.test.ts` con los casos por usuario y apartamento.
  - **Hecho cuando:** `pnpm test` en verde con: suma solo del apartamento indicado; usuario con pagos en ambos apartamentos → solo los de este (caso 5); usuario solo con extras → `totalPagado` correcto y `tienePagos: true` (CA-7.1); sin pagos → `tienePagos: false` (CA-7.2, caso 13).

- [ ] **T10 — Completar tests de `getApartmentSummary` y vacíos** `RF-5, RF-10`
  - **Depende de:** T02 (paralelizable con T04–T09)
  - **Acción:** verificar/añadir en `lib/calculations.test.ts` los casos de topes y el fixture sin pagos.
  - **Hecho cuando:** `pnpm test` en verde con: avance 100 % y pendiente 0 (caso 6); pagos > cuota inicial → pendiente 0 y avance 100 (caso 7); cuota inicial 0 → avance 0 sin división por cero (caso 8); apartamento sin cuotas ni extras → resumen en 0 (defensa, casos 12–13).

- [ ] **T11 — Test de composición "flujo de la página"** `RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10`
  - **Depende de:** T07, T08, T09, T10
  - **Acción:** añadir un `describe` que reproduzca el orden de la página (alcance por apartamento → resumen → filas → usuarios) con fixtures de `data/mock-data.ts` y valide el código exacto.
  - **Hecho cuando:** `pnpm test` en verde con: resultado completo esperado (valores, orden de filas, lista de usuarios) y que `101`/`202` se encuentran mientras `"101 "`, `""`, `"303"` y `"abc"` **no** (RF-9 a nivel de lógica).

- [ ] **T12 — Commit de la etapa 1 (lógica + tests)** `RF: — (proceso)`
  - **Depende de:** T11
  - **Acción:** commitear solo los archivos de lógica y tests, tras aprobación del usuario.
  - **Hecho cuando:** `git log` muestra 1 commit con `lib/installments.ts`, `lib/installments.test.ts`, `lib/calculations.ts` y `lib/calculations.test.ts`; mensaje tipo "lógica pura + tests"; el árbol queda limpio salvo `AGENTS.md` (intacto).

## Fase: Interfaz

- [ ] **T13 — Crear `components/apartment/data-error.tsx`** `RF-11`
  - **Depende de:** T01
  - **Acción:** crear el componente **cliente** con el mensaje "No se pudieron cargar los datos" y el botón "Reintentar" que llama `router.refresh()`.
  - **Hecho cuando:** `pnpm build` compila; exporta `DataError`; el botón re-ejecuta el Server Component en la misma URL sin `setTimeout` ni reintentos automáticos (CA-11.1).

- [ ] **T14 — Crear `components/apartment/apartment-summary.tsx`** `RF-5`
  - **Depende de:** T01
  - **Acción:** crear el componente server que recibe `ApartmentSummary` y pinta exactamente 3 datos: avance % con `ProgressBar`, pagado y pendiente (`formatCOP`).
  - **Hecho cuando:** `pnpm build` compila; muestra avance (`formatPercent`), `valorPagado` y `valorPendiente`; **no** muestra contadores ("X de Y pagadas") ni otros datos de la tarjeta del dashboard (CA-5.1).

- [ ] **T15 — Crear `app/apartment/[codigo]/not-found.tsx`** `RF-9, RF-12`
  - **Depende de:** T01
  - **Acción:** crear la pantalla de no encontrado con el mensaje "Apartamento no encontrado" y el enlace "← Volver" (`Link href="/"`).
  - **Hecho cuando:** `pnpm build` compila; contiene ambos textos exactos y el `Link` al dashboard; respeta los tokens del tema (regla 9).

- [ ] **T16 — Crear `app/apartment/[codigo]/page.tsx` con shell, `params` y control de sesión** `RF-1, RF-12`
  - **Depende de:** T13
  - **Acción:** página server con `main max-w-6xl`, Header, enlace "← Volver" y `<Suspense>` con skeleton; `await params` dentro del límite; `getCurrentUser()` en `try/catch` → `DataError` y, sin sesión, `redirect("/login")`.
  - **Hecho cuando:** sin cookie, GET `/apartment/101` redirige a `/login`; con cookie se ve el shell con "← Volver" y el skeleton mientras carga; el `redirect` queda **fuera** del `try` (plan §6); `pnpm build` compila.

- [ ] **T17 — Añadir consultas, `notFound()` y resumen a la página** `RF-3, RF-4, RF-5, RF-9, RF-11`
  - **Depende de:** T14, T15, T16
  - **Acción:** `Promise.all` de las 4 consultas con `try/catch` → `DataError`; búsqueda por `codigo` **exacto** → `notFound()`; alcance de cuotas/extras al apartamento; render de `ApartmentSummary`.
  - **Hecho cuando:** con sesión, `/apartment/101` muestra avance/pagado/pendiente y **sin datos de 202**; `/apartment/303` muestra "Apartamento no encontrado"; si las consultas fallan aparece `DataError` (nunca "no encontrado"); `notFound()` y `redirect()` están **fuera** del `try`; `pnpm build` compila.

- [ ] **T18 — Implementar la tabla de pagos en la página** `RF-6, RF-8`
  - **Depende de:** T05, T17
  - **Acción:** crear `components/apartment/installments-table.tsx` (**cliente**, con `useState` para el filtro Todas/Pagadas/Pendientes y `aria-pressed`) que pinta las `PaymentRow[]` de `buildPaymentRows`, y añadirlo a la página.
  - **Hecho cuando:** `/apartment/101` muestra la tabla con los **extras antes de la cuota #1**, la columna "Cuota" con `#n` o el concepto, celdas "—" donde no aplica (CA-8.1), `StatusBadge` en estado, y el filtro cambia las cuotas visibles **sin ocultar nunca los extras**; `pnpm build` compila.

- [ ] **T19 — Añadir los mensajes de vacío a la tabla** `RF-6, RF-8, RF-10`
  - **Depende de:** T18
  - **Acción:** implementar en el componente los tres textos con sus condiciones: "Sin cuotas registradas" (BD sin cuotas), "No hay cuotas con este filtro" **debajo de la tabla** (con cuotas en BD y 0 visibles) y "Sin pagos adicionales registrados" (sin extras).
  - **Hecho cuando:** los tres textos exactos están en el código con sus condiciones (revisión) y `pnpm test` + `pnpm build` pasan; el caso 11 queda cubierto por T08; los estados vacíos se tratan como defensa, no como error (CA-6.3, CA-6.4, CA-8.2).

- [ ] **T20 — Aplicar columnas responsive a la tabla (móvil)** `RF-6 (RNF-3)`
  - **Depende de:** T19
  - **Acción:** ocultar en pantallas angostas las columnas secundarias (Fecha programada y Fecha de pago) con `hidden sm:table-cell`, sin scroll horizontal.
  - **Hecho cuando:** en DevTools con viewport de 360 px la página **no** tiene scroll horizontal ni textos encimados; en escritorio se ven todas las columnas (sin columna "Apartamento", decisión §8.9).

- [ ] **T21 — Implementar `components/apartment/apartment-users.tsx` y cablearlo** `RF-7, RF-4`
  - **Depende de:** T06, T17
  - **Acción:** crear el componente que lista, con `getUserApartmentSummary`, solo los usuarios con pagos en ese apartamento y su total; añadirlo a la página.
  - **Hecho cuando:** `/apartment/101` lista solo los usuarios que pagaron en 101 con su total (cuotas + extras) y nunca montos de 202; sin pagos muestra "Sin pagos registrados en este apartamento" (defensa); `pnpm build` compila.

- [ ] **T22 — Hacer clicable la tarjeta del dashboard** `RF-2 (CA-2.1, RNF-8)`
  - **Depende de:** T02
  - **Acción:** envolver la tarjeta de `components/dashboard/apartment-card.tsx` en `Link` a `/apartment/{codigo}` con hover y `focus-visible` usando las clases del tema.
  - **Hecho cuando:** en `/`, Tab enfoca la tarjeta y Enter abre `/apartment/101` (y 202); el foco visible usa el ring del tema; `pnpm build` compila.

- [ ] **T23 — Retirar la sección de cuotas del dashboard** `RF-2 (CA-2.2)`
  - **Depende de:** T02
  - **Acción:** quitar el import y el uso de `InstallmentsSection` en `app/page.tsx` y borrar `components/dashboard/installments-section.tsx`.
  - **Hecho cuando:** `/` ya no renderiza la tabla de cuotas ni sus filtros (queda resumen, tarjetas y usuarios); `grep -r "InstallmentsSection"` no devuelve resultados; el archivo ya no existe; `pnpm build` + `pnpm lint` pasan.

- [ ] **T24 — Recordar la dirección pedida al redirigir al login** `RF-1 (CA-1.1)`
  - **Depende de:** T16
  - **Acción:** cambiar en la página el destino a `/login?next=/apartment/{codigo}` (`encodeURIComponent`).
  - **Hecho cuando:** sin sesión, el redirect de `/apartment/101` tiene como destino exacto `/login?next=%2Fapartment%2F101`.

- [ ] **T25 — Hacer que el login reciba `next`** `RF-1 (CA-1.3, parcial)`
  - **Depende de:** T24
  - **Acción:** en `app/login/page.tsx` leer `searchParams` (Promise en Next 16) dentro del `Suspense` y pasar `next` saneado (solo si matchea `^/apartment/[^/]+$`) a `LoginForm`, que añade el input oculto `name="next"`.
  - **Hecho cuando:** `/login?next=/apartment/101` pinta `<input type="hidden" name="next" value="/apartment/101">`; con un `next` que no matchee la forma interna el valor es vacío; `pnpm build` compila.

- [ ] **T26 — Validar `next` en la Server Action del login** `RF-1 (CA-1.3), RF-3`
  - **Depende de:** T25
  - **Acción:** en `app/actions/auth.ts`, tras crear la sesión: si `next` matchea la regex y `getApartments()` contiene ese código → `redirect(next)`; en otro caso (o si la consulta falla) → `redirect("/")`.
  - **Hecho cuando:** login con `next=/apartment/101` aterriza en `/apartment/101`; con `next=/apartment/303` o `next=https://evil.example` aterriza en `/`; si `getApartments()` lanza, aterriza en `/` sin error visible; `pnpm build` compila (sin open redirect, constitución 5).

- [ ] **T27 — Commit de la etapa 2 (página y componentes)** `RF: — (proceso)`
  - **Depende de:** T19, T20, T21
  - **Acción:** commitear la ruta nueva, el `not-found` y `components/apartment/*`, tras aprobación del usuario.
  - **Hecho cuando:** `git log` muestra 1 commit con `app/apartment/**`, `components/apartment/*` y mensaje tipo "feat: pagina por apartamento"; árbol limpio salvo `AGENTS.md`.

- [ ] **T28 — Commit de la etapa 3 (dashboard y login)** `RF: — (proceso)`
  - **Depende de:** T22, T23, T26
  - **Acción:** commitear los cambios de dashboard y login, tras aprobación del usuario.
  - **Hecho cuando:** `git log` muestra 1 commit con `app/page.tsx`, `apartment-card.tsx`, `app/login/page.tsx`, `login-form.tsx`, `app/actions/auth.ts` y el borrado de `installments-section.tsx`; mensaje tipo "feat: dashboard sin cuotas y login con next"; árbol limpio salvo `AGENTS.md`.

## Fase: Integración

- [ ] **T29 — Script E2E parte A: sesión, dashboard y `next`** `RF-1, RF-2, RF-3`
  - **Depende de:** T23, T26
  - **Acción:** crear el script temporal `e2e-apartment.mjs` (en Temp, patrón del `e2e-login.mjs`, `node` + `fetch`, PIN como argumento) con los checks de navegación.
  - **Hecho cuando:** `node e2e-apartment.mjs <pin>` imprime en verde: `/` sin cookie → `/login`; dashboard **sin** sección de cuotas; cada tarjeta es `<a href="/apartment/101|202">`; login con `next` válido → aterriza en `/apartment/101`; login con `next=/apartment/303` y con `next=https://…` → aterriza en `/`.

- [ ] **T30 — Script E2E parte B: contenido y no encontrado** `RF-4, RF-5, RF-6, RF-8, RF-9, RF-12`
  - **Depende de:** T19, T29
  - **Acción:** añadir al mismo script los checks de contenido de la página.
  - **Hecho cuando:** el script imprime en verde: `/apartment/101` con cookie → 200 con avance/pagado/pendiente; **los extras aparecen antes de la cuota #1** en el HTML; filtros "Todas/Pagadas/Pendientes" presentes; "← Volver" visible; sin `<th>Apartamento</th>`; `/apartment/303` → "Apartamento no encontrado" + "← Volver".

- [ ] **T31 — Verificar RF-11 manualmente con la BD caída** `RF-11 (casos 3 y 14)`
  - **Depende de:** T17
  - **Acción:** detener MySQL, abrir `/apartment/101`, pulsar "Reintentar" 2 veces y restaurar MySQL.
  - **Hecho cuando:** con MySQL detenido se ve "No se pudieron cargar los datos" (nunca "no encontrado"); las 2 pulsaciones muestran el mismo mensaje sin límite ni bloqueo; con MySQL restaurado, "Reintentar" carga los datos reales.

## Fase: Verificación final

- [ ] **T32 — Suite completa en verde** `RF-4, RF-5, RF-6, RF-7, RF-8, RF-10 (RNF-1)`
  - **Depende de:** T29, T30, T31
  - **Acción:** ejecutar `pnpm test` tras todo el cambio.
  - **Hecho cuando:** todos los tests verdes (los 46 previos + los nuevos), 0 fallos, sin skips.

- [ ] **T33 — Build de producción sin errores** `RF: — (proceso)`
  - **Depende de:** T32
  - **Acción:** matar el puerto 3000 y ejecutar `pnpm build`.
  - **Hecho cuando:** el build termina sin errores de TypeScript ni de Next.

- [ ] **T34 — Lint sin errores** `RF: — (proceso)`
  - **Depende de:** T33
  - **Acción:** ejecutar `pnpm lint`.
  - **Hecho cuando:** 0 errores de ESLint (los 17 warnings preexistentes se aceptan).

- [ ] **T35 — Verificar casos límite 1–7** `RF-1, RF-3, RF-4, RF-5, RF-9, RF-11`
  - **Depende de:** T34
  - **Acción:** comprobar la evidencia de cada caso según la vía de la spec (§9): 1 → T30; 2 → T29; 3 → T31; 4 → manual (borrar cookie y recargar → login); 5 → T09; 6 y 7 → T10.
  - **Hecho cuando:** los 7 casos tienen evidencia ejecutada y marcada; si alguno falla, se corrige y se repite antes de continuar.

- [ ] **T36 — Verificar casos límite 8–14** `RF-5, RF-6, RF-7, RF-8, RF-10, RF-11`
  - **Depende de:** T34
  - **Acción:** comprobar la evidencia: 8 → T10; 9 → T08; 10 → T07; 11 → T08; 12 y 13 → T10/T09 (defensa, sin verificación manual); 14 → T31.
  - **Hecho cuando:** los 7 casos tienen evidencia ejecutada y marcada; los de defensa quedan cubiertos a nivel de lógica (decisión 7 de la spec).

- [ ] **T37 — Móvil, accesibilidad y tema** `RNF-3, RNF-4, RNF-5, RNF-8`
  - **Depende de:** T34
  - **Acción:** recorrer la página y el dashboard en DevTools: viewport 360 px, teclado, ambos temas y `prefers-reduced-motion`.
  - **Hecho cuando:** sin scroll horizontal ni textos encimados en móvil (RNF-3); mismos componentes/estilos del dashboard con tokens de tema y sin colores fijos (RNF-4); textos visibles en español (RNF-5); Tab + Enter en la tarjeta y `aria-pressed` en el filtro (RNF-8); el skeleton respeta `prefers-reduced-motion`.

- [ ] **T38 — Revisar la matriz de trazabilidad** `RF-1 … RF-12 (12/12)`
  - **Depende de:** T35, T36, T37
  - **Acción:** recorrer la matriz de abajo y comprobar que toda tarea asociada a cada RF está marcada con su "Hecho cuando" cumplido.
  - **Hecho cuando:** 12/12 RF tienen ≥1 tarea completada con evidencia; si falta alguna, se crea la tarea que falte y se ejecuta **antes** de cerrar (constitución 2).

- [ ] **T39 — Actualizar `MEMORY.md`** `RF: — (proceso)`
  - **Depende de:** T38
  - **Acción:** registrar el estado final (spec + plan + implementación), decisiones nuevas y errores a evitar; proponer al usuario actualizar la sección Estructura de `AGENTS.md` (sin tocarlo sin aprobación).
  - **Hecho cuando:** `MEMORY.md` queda breve (~50 líneas), con el cierre de la tarea 001; `git status` muestra solo los cambios esperados y `AGENTS.md` intacto.

- [ ] **T40 — Commit final de cierre** `RF: — (proceso)`
  - **Depende de:** T39
  - **Acción:** commitear `tasks.md` (si sigue sin commitear) y `MEMORY.md`; el push se hace **solo** con aprobación explícita del usuario.
  - **Hecho cuando:** `git log` muestra el commit de cierre y el árbol queda limpio salvo `AGENTS.md`.

---

## Matriz RF → tareas (cobertura completa)

| RF | CA | Tareas | Estado |
|---|---|---|---|
| RF-1 — Acceso protegido | 3 | T16, T24, T25, T26, T29, T35 | ☐ |
| RF-2 — Dashboard (tarjeta + retiro de cuotas) | 2 | T22, T23, T29 | ☐ |
| RF-3 — URL directa con sesión | 1 | T17, T26, T29 | ☐ |
| RF-4 — Solo ese apartamento | 2 | T06, T09, T11, T17, T21, T30, T32, T35 | ☐ |
| RF-5 — Resumen (avance + pagado + pendiente) | 2 | T10, T14, T17, T30, T32, T35, T36 | ☐ |
| RF-6 — Cuotas y filtro | 4 | T04, T05, T07, T08, T11, T18, T19, T20, T30, T32, T36 | ☐ |
| RF-7 — Usuarios del apartamento | 3 | T06, T09, T11, T21, T32, T36 | ☐ |
| RF-8 — Pagos adicionales | 3 | T04, T05, T07, T08, T11, T18, T19, T30, T32, T36 | ☐ |
| RF-9 — No encontrado | 2 | T11, T15, T17, T30, T35 | ☐ |
| RF-10 — Sin datos (defensa) | 1 | T10, T11, T19, T32, T36 | ☐ |
| RF-11 — Error + reintento | 4 | T13, T17, T31, T32, T35, T36 | ☐ |
| RF-12 — Volver al dashboard | 1 | T15, T16, T30 | ☐ |

**12/12 RF con tareas asociadas** ☐ = pendiente; al cerrar, cada fila queda ✅ cuando sus tareas estén marcadas.

### RNF → tareas (complemento)

| RNF | Tareas |
|---|---|
| RNF-1 — Cálculos con tests | T07–T11, T32 |
| RNF-2 — Datos vigentes | T29, T30 (cada request consulta la BD) |
| RNF-3 — Responsive | T20, T37 |
| RNF-4 — Consistencia | T14, T15, T22, T37 |
| RNF-5 — Español | T37 |
| RNF-6 — Sin dependencias nuevas | T03 |
| RNF-7 — Seguridad | T16, T25, T26, T31 |
| RNF-8 — Accesibilidad | T18, T22, T37 |
| RNF-9 — Lógica pura / estado en UI | T04–T06, T18, T19 |

