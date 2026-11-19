# Plan 001 — Página independiente por apartamento

**Spec:** `specs/001-apartment/spec.md` (12 RF · 28 CA · 9 HU · 9 RNF · 14 casos límite · 0 dudas)
**Constitución:** `docs/CONSTITUTION.md` (6 principios)
**Alcance:** plan de implementación **sin código**; cada sección indica qué RF cubre.
**Contexto:** la petición original mencionaba `specs/001-heat-map/` (referencia a otro curso); el usuario confirmó que el plan corresponde a **nuestro** spec `001-apartment` y que los tests son con **Vitest** (no `node --test`).
**Fuentes técnicas:** docs oficiales de Next 16 (`node_modules/next/dist/docs/`: `dynamic-routes.md`, `not-found.md`), código actual del proyecto y la spec.

---

## 1. Resumen de comprensión del problema

Hoy toda la información vive en un único dashboard (`app/page.tsx`): resumen global, tarjetas de los dos apartamentos, resumen de usuarios y la tabla de cuotas con **dos filtros** (estado y apartamento). Para revisar cómo va un apartamento hay que mirar la vista completa y filtrar a mano; los datos de 101 y 202 se mezclan en la misma tabla.

**Problema:** cada apartamento necesita su propia página (`/apartment/101`, `/apartment/202`) con **solo su información** — resumen (avance, pagado, pendiente), tabla de pagos adicionales + cuotas con filtro de estado, y quiénes han pagado en él — a la que se llega desde la tarjeta del dashboard o escribiendo la dirección directamente. Como parte del cambio, **el dashboard retira la sección de cuotas con sus filtros** (RF-2.2) y sus tarjetas pasan a ser clicable (RF-2.1).

**Restricciones que condicionan el diseño:**
- Misma capa de datos (`data/db.ts`, MySQL local) — **sin cambios en ella** (regla 1 de AGENTS).
- Mismos cálculos puros (`lib/calculations.ts`) — reutilizar y extender sin duplicar reglas (constitución 3).
- Login por Server Actions + cookie firmada (sin API REST); la sesión manda sobre cualquier otra cosa (RF-1).
- Next 16 con Cache Components: `params`/`cookies()` dentro de `<Suspense>`, sin consultas de BD en build.
- Sin dependencias nuevas (constitución 1, RNF-6).

**RF cubiertos:** RF-2, RF-3 y RF-4 describen el estado actual y el objetivo; el resto se detalla en §3.

## 2. Lista completa de RF

Identificados en la spec (fuente única: `specs/001-apartment/spec.md`):

| RF | Requisito | CA | HU | Casos límite |
|---|---|---|---|---|
| RF-1 | Acceso protegido: sin sesión → login sin consultar la BD de apartamentos | 3 (1.1–1.3) | HU-2, HU-8 | 2 |
| RF-2 | Llegada desde el dashboard; el dashboard retira la sección de cuotas | 2 (2.1–2.2) | HU-1, HU-2 | — |
| RF-3 | Llegada por URL directa con sesión válida | 1 (3.1) | HU-2 | — |
| RF-4 | Contenido: solo información financiera de ese apartamento | 2 (4.1–4.2) | HU-3 | 5 |
| RF-5 | Resumen: avance % + pagado + pendiente | 2 (5.1–5.2) | HU-3 | 6, 7, 8 |
| RF-6 | Cuotas: número fijo, orden ascendente, filtro único de estado | 4 (6.1–6.4) | HU-3, HU-4 | 9, 11 |
| RF-7 | Usuarios del apartamento: total = cuotas + extras; sin pagos → no aparece | 3 (7.1–7.3) | HU-3 | 13 |
| RF-8 | Pagos adicionales al principio, fecha asc, concepto en columna "Cuota", siempre visibles | 3 (8.1–8.3) | HU-3 | 10, 12 |
| RF-9 | Apartamento no encontrado (dirección ≠ código exacto, con BD respondiendo) | 2 (9.1–9.2) | HU-5 | 1 |
| RF-10 | Apartamento sin datos: vacío, no error | 1 (10.1) | HU-6 | 12, 13 |
| RF-11 | Error al cargar: mensaje + reintento manual libre; todo o nada | 4 (11.1–11.4) | HU-7 | 3, 14 |
| RF-12 | Vuelta al dashboard: enlace "← Volver" en ambas páginas | 1 (12.1) | HU-9 | — |

**RF cubiertos:** 12/12 (lista completa; ninguno queda fuera de este plan).

## 3. Matriz de trazabilidad RF → diseño propuesto

| RF | Archivos (§4) | Funciones puras (§5) | Verificación (§9) |
|---|---|---|---|
| RF-1 | `app/apartment/[codigo]/page.tsx`, `app/actions/auth.ts`, `app/login/page.tsx`, `components/login/login-form.tsx` | — (sesión/BD) | E2E redirects + manual (BD caída) |
| RF-2 | `app/page.tsx`, `components/dashboard/apartment-card.tsx` | — | E2E HTML del dashboard |
| RF-3 | página + login (`next`) | — | E2E `/apartment/101` con cookie |
| RF-4 | página (alcance de datos) | `getApartmentSummary`, `getUserApartmentSummary` | Unit (pipeline) + E2E |
| RF-5 | `components/apartment/apartment-summary.tsx` | `getApartmentSummary` (existente) | Unit + E2E |
| RF-6 | `components/apartment/installments-table.tsx` | `filterRowsByEstado`, `buildPaymentRows` | Unit + E2E |
| RF-7 | `components/apartment/apartment-users.tsx` | `getUserApartmentSummary` | Unit + E2E |
| RF-8 | `installments-table.tsx` + `lib/installments.ts` | `buildPaymentRows` | Unit (orden) + E2E (orden en HTML) |
| RF-9 | página (find exacto) + `app/apartment/[codigo]/not-found.tsx` | find por código exacto (inline) | Unit (lógica) + E2E (`303`/`101`) |
| RF-10 | página + `installments-table.tsx` (mensajes) | composición + fixtures vacíos | Unit (defensa) |
| RF-11 | página (`try/catch`) + `components/apartment/data-error.tsx` | — | Manual (parar MySQL) + revisión |
| RF-12 | página (Volver) + `not-found.tsx` | — | E2E HTML |

**RF cubiertos:** 12/12 — cada RF tiene al menos una verificación obligatoria.

## 4. Archivos a crear o modificar y responsabilidad de cada uno

### Crear

1. **`app/apartment/[codigo]/page.tsx`** — página Server Component: shell (Header + "← Volver") + `<Suspense>`; dentro: `await params` → sesión (RF-1) → consultas con `try/catch` (RF-11) → `notFound()` si el código no coincide exacto (RF-9) → alcance por apartamento (RF-4) → cálculos puros → render de resumen/tabla/usuarios (RF-5, 6, 7, 8, 10, 12). **RF-1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12.**
2. **`app/apartment/[codigo]/not-found.tsx`** — pantalla autónoma "Apartamento no encontrado" + enlace "← Volver" (RF-9, RF-12).
3. **`components/apartment/apartment-summary.tsx`** — resumen de 3 datos (avance % con `ProgressBar`, pagado, pendiente); server, solo props (RF-5).
4. **`components/apartment/installments-table.tsx`** — componente **cliente**: filtro de estado (Todas/Pagadas/Pendientes, `aria-pressed`) + tabla con extras primero y mensajes de vacío/filtro (CA-6.3, 6.4, 8.2, 8.3) (RF-6, RF-8).
5. **`components/apartment/apartment-users.tsx`** — lista de usuarios con su total en el apartamento o "Sin pagos registrados en este apartamento" (RF-7).
6. **`components/apartment/data-error.tsx`** — componente **cliente**: "No se pudieron cargar los datos" + botón "Reintentar" (`router.refresh()`, reintento libre) (RF-11).
7. **`lib/installments.ts`** — funciones puras `buildPaymentRows` y `filterRowsByEstado` (RF-6, RF-8).
8. **`lib/installments.test.ts`** — tests unitarios de las funciones anteriores (RF-6, RF-8).

### Modificar

9. **`app/page.tsx`** — quitar `InstallmentsSection` (import y uso) (RF-2.2).
10. **`components/dashboard/apartment-card.tsx`** — envolver la tarjeta en `Link` a `/apartment/{codigo}` con estilos hover/focus del tema (RF-2.1, RNF-8).
11. **`app/login/page.tsx`** — recibir `searchParams` (Promise en Next 16), pasar `next` (ya saneado) al formulario (RF-1 / CA-1.3).
12. **`components/login/login-form.tsx`** — campo oculto `next` en el formulario (CA-1.3).
13. **`app/actions/auth.ts`** — tras el login exitoso, validar `next` (regex interna + existencia del código en BD) → `redirect(next)` o `redirect("/")` (CA-1.3).
14. **`lib/calculations.ts`** — añadir `getUserApartmentSummary` junto a las `get*Summary` existentes (RF-7).
15. **`lib/calculations.test.ts`** — añadir tests de `getUserApartmentSummary` y fixtures vacíos (RF-4, RF-7, RF-10; casos 5, 12, 13; verificar casos 6–8).

### Eliminar

16. **`components/dashboard/installments-section.tsx`** — reemplazada por el archivo 4; sin uso tras el retiro del dashboard (RF-2.2).

### Sin tocar (decisiones)

- **`data/db.ts`** — RF-9 valida contra `getApartments()` existente (ya devuelve `codigo`); `getInstallments` ya mapea `vencida → pendiente` (línea 145). **Ninguna consulta nueva.**
- `components/ui/*` (regla 8), `lib/auth.ts`, `lib/session.ts`, `lib/format.ts`, `components/dashboard/header.tsx` y el resto del dashboard.
- **Sin dependencias nuevas** (RNF-6): se usa `next/link` y `next/navigation`, ya incluidos.
- `AGENTS.md` (archivo del usuario): al cerrar la implementación se propondrá actualizar su sección Estructura con los archivos nuevos — solo con su aprobación.

### Verificación (fuera del repo)

17. **Script E2E HTTP temporal** (patrón del `e2e-login.mjs` actual, en Temp): actualizar los checks del dashboard y añadir los de la nueva página — cubre todos los RF.

**RF cubiertos:** 12/12 (cada archivo está vinculado a sus RF).

## 5. Funciones puras de lógica necesarias

### Reutilizadas sin cambios

- **`getApartmentSummary(apartamento, cuotas, extras)`** (existente, `lib/calculations.ts`): ya implementa pagado = cuotas pagadas + extras, pendiente = max(0, inicial − pagado), avance = tope 100 % e inicial 0 → 0. **CA-5.1, CA-5.2, casos 6, 7, 8** — con sus tests existentes.

### Nuevas

| Función | Archivo | Entradas → Salida | Reglas (CA) |
|---|---|---|---|
| `getUserApartmentSummary(usuario, apartamento, cuotas, extras)` | `lib/calculations.ts` | usuario + apartamento + arrays → `{ cuotasPagadas, totalPagado, tienePagos }` | Suma **solo** sus cuotas pagadas y **solo** sus extras de ese apartamento; `tienePagos` = ≥1 cuota pagada o ≥1 extra en él (CA-7.1, CA-7.2; casos 5, 13) |
| `buildPaymentRows(cuotas, extras)` | `lib/installments.ts` (nuevo) | cuotas y extras **ya del apartamento** → `PaymentRow[]` | Extras primero con fecha ascendente; después cuotas con `numero` ascendente (número fijo de la BD, no se renumera); tipo `"extra"` sin número/estado/fecha programada (CA-6.1, CA-8.1; A2, E7) |
| `filterRowsByEstado(filas, estadoFiltro)` | `lib/installments.ts` | filas + `EstadoFiltro` ("todas" \| "pagada" \| "pendiente") → `PaymentRow[]` | Las extras se mantienen **siempre**; las cuotas según el estado; una cuota "vencida" ya llega como "pendiente" (mapeo en `data/db.ts:145`) y por eso entra en "Pendientes" (CA-6.2, CA-8.3; casos 9, 11) |

**Tipo `PaymentRow`:** unión discriminada por `tipo` — `"extra"` → concepto, monto, fecha, usuario; `"cuota"` → numero, valor, fechaLimite, estado, userId?, fechaPago?. La tabla deriva de aquí las celdas "—" de CA-8.1.

Los mensajes de vacío (CA-6.3, CA-6.4, CA-7.3, CA-8.2) son decisión de la interfaz sobre estas salidas (totales y conteos), no funciones nuevas — estado de UI permitido por RNF-9.

### Dependencias temporales (parámetro `hoy`)

- **Regla (constitución 3):** ninguna función de `lib/` llama a `Date.now()` ni `new Date()`. Si alguna necesita "hoy", lo recibe como parámetro **`hoy: string`** con formato `"YYYY-MM-DD"` (el mismo que devuelve MySQL con `dateStrings: true`), y quien la llama (la página, en el servidor) se lo pasa.
- **Análisis de esta spec:** ninguna de las funciones anteriores depende del reloj — los estados llegan ya resueltos de la capa de datos (`vencida → pendiente` en `data/db.ts:145`) y las fechas se comparan como strings ISO. Por eso `hoy` **no se agrega hoy**: añadirlo sin uso sería código muerto (haz solo lo pedido).
- **Previsión:** si en el futuro se derivara "vencida" en lógica pura (`pendiente && fechaLimite < hoy`), esa función recibirá `hoy` — no leerá el reloj — y tendrá tests con distintos valores de `hoy`. Cubre así el caso límite 9 sin depender de la BD.

**RF cubiertos:** RF-4 (alcance), RF-5, RF-6, RF-7, RF-8, RF-10. RF-1, 2, 3, 9, 11 y 12 no tienen lógica pura (son flujo de sesión, navegación y errores — ver §6).

## 6. Algoritmo detallado (pseudocódigo)

### Entradas

- `codigo`: segmento de la URL — **cualquier string** (el usuario puede escribir lo que quiera).
- Cookie de sesión (httpOnly, firmada HMAC): presente / ausente / válida / manipulada.
- BD (4 consultas existentes): apartamentos, cuotas, extras, usuarios.
- (Cliente) `estadoFiltro`: "todas" | "pagada" | "pendiente"; inicial "todas".
- (Login) campo oculto `next`: dirección pedida antes de llegar al login.

### Salidas

1. Vista completa del apartamento (resumen + tabla + usuarios + "← Volver"), o
2. redirect a `/login` (sin sesión), o
3. página "Apartamento no encontrado" (con "← Volver"), o
4. estado "No se pudieron cargar los datos" + Reintentar (RF-11), o
5. (tras login) redirect a la dirección pedida si era válida, o al dashboard si no.

### Reglas de negocio (precedencias, tomadas de la spec)

- **R1 (RF-1 / CA-1.1 / C1 / C3):** sin sesión válida → **siempre** login, sin consultar la BD de apartamentos, aunque la dirección sea mala o la BD esté caída. La verificación de firma es local con `SESSION_SECRET`; solo se revalida el usuario en `persona`, nunca `apartamento`.
- **R2 (RF-11 / CA-11.3–11.4 / C2):** si cualquier consulta falla → estado de error con reintento; **nunca** "no encontrado"; **nunca** datos mezclados (todo o nada).
- **R3 (RF-9 / CA-9.1 / A1):** "no encontrado" solo con BD respondiendo y `codigo` sin coincidencia **exacta** con `apartment.codigo` (case-sensitive, sin trim: `101` vale; `101 `, `303`, `abc` no).
- **R4 (RF-5):** pagado = cuotas pagadas + extras; pendiente = max(0, cuota inicial − pagado); avance = inicial > 0 ? min(100, pagado / inicial × 100) : 0.
- **R5 (RF-6 / RF-8):** filas = extras (fecha ascendente) primero + cuotas (numero ascendente) después; el filtro toca **solo** cuotas; vencida = pendiente.
- **R6 (RF-7):** total del usuario en el apartamento = sus cuotas pagadas ahí + sus extras ahí; sin pagos → no aparece en la lista.
- **R7 (CA-1.3):** tras login exitoso: `next` con forma `/apartment/<código>` cuyo código exista en la BD → redirect a `next`; en otro caso (dirección inválida, `next` ausente o BD no responde) → redirect al dashboard.

### Pseudocódigo A — página `/apartment/[codigo]`

```
SHELL (Server Component, síncrono, se sirve al instante):
  render Header + enlace "← Volver" (→ "/")
  render <Suspense fallback={skeleton aria-busy}> → CONTENIDO
  // Sin generateStaticParams: params y BD son datos de runtime (docs Next 16)

CONTENIDO (async, dentro del Suspense):
  1. codigo := await params                       // params es Promise en Next 16

  2. SESIÓN (RF-1 — try SOLO aquí; redirect FUERA):
     try:    usuario := getCurrentUser()         // cookie → firma → revalida en `persona`
     catch:  → ESTADO_ERROR (RF-11)               // BD caída con firma válida → R2 (C3)
     si usuario == null:
         redirect("/login?next=" + encode("/apartment/" + codigo))   // R1, sin consultar apartamentos

  3. DATOS (RF-11 — try SOLO alrededor de las consultas, todo o nada):
     try:    [apartamentos, cuotas, extras, usuarios] := Promise.all(
                 getApartments, getInstallments, getExtraPayments, getUsers)
     catch:  → ESTADO_ERROR (RF-11, reintento manual libre)

  4. DIRECCIÓN (RF-9 — FUERA del try, para que notFound() no caiga en el catch):
     apto := primer apartamento con apto.codigo == codigo      // exacto (R3)
     si no existe: notFound() → not-found.tsx del segmento
                   ("Apartamento no encontrado" + "← Volver")

  5. ALCANCE (RF-4):  cuotasApto  := cuotas  con apartmentId == apto.id
                      extrasApto := extras con apartmentId == apto.id

  6. CÁLCULOS (puros, §5):
     resumen    := getApartmentSummary(apto, cuotasApto, extrasApto)   // R4
     filas      := buildPaymentRows(cuotasApto, extrasApto)            // R5
     usuariosApto := para cada usuario:                                // R6
         s := getUserApartmentSummary(u, apto, cuotasApto, extrasApto)
         incluir solo si s.tienePagos

  7. RENDER (todos los textos en español, tokens del tema):
     ApartmentSummary   → avance % con barra + pagado + pendiente (CA-5.1, 3 datos)
     InstallmentsTable (cliente), estadoFiltro inicial "todas":
         visibles := filterRowsByEstado(filas, estadoFiltro)           // extras siempre
         mensajes:
           sin cuotas en BD            → "Sin cuotas registradas"      // CA-6.3 (defensa)
           con cuotas y 0 visibles     → "No hay cuotas con este filtro"
                                         (debajo de la tabla)          // CA-6.4, caso 11
           sin extras                  → "Sin pagos adicionales registrados" // CA-8.2, caso 10
     ApartmentUsers  → lista con totales o "Sin pagos registrados en
                       este apartamento"                               // CA-7.3 (defensa)
     enlace "← Volver" (visible también en estados de error)           // CA-12.1
```

### Pseudocódigo B — Server Action de login (CA-1.3 / R7)

```
login(formData):
  ...validación actual intacta (rate limit, PIN, mensaje genérico)...
  crear sesión (cookie)
  next := formData.next
  si next coincide con ^/apartment/[^/]+$ :
      try:    si algún apartamento de getApartments() tiene ese código → redirect(next)
      catch:  (BD no responde) → continuar al fallback
  redirect("/")        // dirección inválida, next vacío o BD caída → dashboard
```

### Casos límite → rama (los 14 de la spec)

| # | Caso | Rama del algoritmo |
|---|---|---|
| 1 | Dirección distinta de 101/202 | Paso 4 → `notFound()` (solo si el paso 3 respondió) |
| 2 | Sin sesión / cookie manipulada | Paso 2 → login con `next`; tras login → R7 |
| 3 | BD caída (total, parcial o al verificar) | Catch del paso 2 o 3 → ESTADO_ERROR (R2) |
| 4 | Sesión expira mientras se mira la página | Sin vigilancia: los datos cargados quedan hasta navegar/recargar → paso 2 → login (decisión 10) |
| 5 | Usuario paga en ambos apartamentos | Paso 5 (alcance) + `getUserApartmentSummary` filtra por apartamento (CA-4.2) |
| 6 | Avance al 100 % | R4: min(100, …) → pendiente 0 (unit) |
| 7 | Pagos superan la cuota inicial | R4: pendiente max(0, …), avance tope 100 (unit) |
| 8 | Cuota inicial en 0 | R4: avance 0, sin división por cero (unit) |
| 9 | Estado "vencida" | Mapeo `data/db.ts:145` → llega "pendiente" → badge y filtro la tratan como pendiente (unit + revisión) |
| 10 | Apartamento sin extras | Paso 7 → mensaje CA-8.2 (defensa) |
| 11 | Filtro que deja 0 cuotas | `filterRowsByEstado` → 0 cuotas visibles (extras visibles) → mensaje CA-6.4 debajo (unit) |
| 12 | Sin cuotas pero con extras | Paso 7: filas de extras + "Sin cuotas registradas" debajo; avance > 0 (unit, defensa) |
| 13 | Apartamento sin ningún pago | Paso 6: `usuariosApto` vacío + resumen 0 → mensajes, no error (unit, defensa) |
| 14 | Reintento que vuelve a fallar | `data-error`: botón siempre activo → mismo estado → mismo mensaje (manual) |

### Complejidad aproximada

- **Tiempo por request:** O(A + C·log C + E·log E + U·(C+E)), con A=2 apartamentos, C=12 cuotas, E=pocos extras, U=4 usuarios → en la práctica **lineal con constantes ínfimas**. El orden se garantiza en código aunque la BD ya ordene (lo manda la spec, no el `ORDER BY`).
- **Espacio:** O(C + E + U) en memoria de la request.
- **Consultas:** 4 en paralelo (`Promise.all`) + 1 solo si el login recibe `next`; **0 en build** (sin `generateStaticParams`); la sesión nunca consulta `apartamento`.
- **Reintentos:** 0 automáticos; cada "Reintentar" = 1 request completa (mismo coste inicial).

**RF cubiertos:** RF-1, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12 (RF-2 se detalla en §7 por ser de render y navegación).

## 7. Estrategia de renderizado en la interfaz

- **Servidor por defecto:** la página es un Server Component; todos los datos se leen y calculan en el servidor y llegan como props (constitución 3: la interfaz solo pinta props; RNF-9).
- **Streaming / Cache Components:** shell (Header + "← Volver" + skeleton `aria-busy`) al instante; `params`, `cookies()` y las 4 consultas dentro de `<Suspense>` — mismo patrón que `app/page.tsx` y `app/login/page.tsx` (exigencia de Next 16 sin `generateStaticParams`, verificada en `dynamic-routes.md`).
- **Sin caché:** no se usa `'use cache'` → cada apertura consulta la BD → datos vigentes (RNF-2); el build nunca toca la BD.
- **Solo dos componentes de cliente** (los únicos con `"use client"`):
  1. `installments-table.tsx` — estado del filtro con `useState` (patrón `FilterGroup` actual con `aria-pressed`) — RF-6, RNF-8, RNF-9.
  2. `data-error.tsx` — botón "Reintentar" con `router.refresh()` (re-ejecuta el Server Component en la misma URL; reintento manual y libre, sin límite — CA-11.1).
- **`params` como Promise:** la página se tipa con `PageProps<"/apartment/[codigo]">` y hace `await params` dentro del componente async bajo Suspense (convención Next 16, documentada en `dynamic-routes.md`).
- **`notFound()`:** se dispara **después** de confirmar que la BD respondió; renderiza `app/apartment/[codigo]/not-found.tsx` (convención `not-found.md`). Nota: al ocurrir durante el streaming, el estado HTTP puede ser 200 con `<meta name="robots" content="noindex">`; la spec no exige código 404 (riesgo registrado en §10).
- **Estructura visual** (mismo esqueleto que el dashboard, RNF-4): `main max-w-6xl` → Header → "← Volver" → `<Suspense>` con resumen (3 datos), tabla con filtro y usuarios. Estados: skeleton (cargando), vista completa, "no encontrado" (fuera del shell) y error RF-11 (con "← Volver" visible).
- **Responsive (RNF-3):** una columna en móvil; la tabla **oculta columnas secundarias en pantallas angostas** (`hidden sm:table-cell`) en vez de scroll horizontal; cifras con `tabular-nums`; sin `overflow-x-auto` en la página.
- **Accesibilidad (RNF-8):** la tarjeta es un `<Link>` nativo → Tab + Enter funcionan; `focus-visible:ring` con clases del tema; filtro con `aria-pressed`; mensajes con `aria-live`; skeleton con `aria-busy` + `motion-reduce:animate-none` (patrón existente).
- **Tema:** solo tokens (`bg-card`, `text-muted-foreground`, `bg-muted`…) — sin colores fijos (regla 9); el `not-found` queda dentro del root layout → respeta claro/oscuro.
- **Fuera de alcance:** `generateMetadata` por apartamento, gráficas y formularios de pago.

**RF cubiertos:** RF-1, RF-2 (retiro de cuotas + tarjeta clicable), RF-3, RF-5, RF-6, RF-7, RF-8, RF-9, RF-11, RF-12 + RNF-1 a RNF-9.

## 8. Decisiones técnicas justificadas y alternativa descartada

| # | Decisión (RF) | Alternativa descartada | Por qué |
|---|---|---|---|
| 1 | Ruta **`/apartment/[codigo]`** (RF-3) | `/apartamento/101` | Segmento en inglés como el `/login` ya existente; RNF-5: nombres técnicos en inglés. El parámetro se llama `codigo` por ser el campo del modelo (`Apartment.codigo`). |
| 2 | **Sin `generateStaticParams`**; todo bajo `<Suspense>` (RF-1, RF-11) | Muestrear `[{codigo:"101"},{codigo:"202"}]` | Con BD y cookies en runtime, el prerender solo cubriría 101/202 y dejaría sin validar ramas reales (docs Next 16), además de exigir BD en build. El patrón del dashboard ya funciona así. |
| 3 | **`notFound()` + `not-found.tsx` del segmento** (RF-9) | Pantalla "no encontrado" renderizada condicionalmente dentro de la página | Es la convención de Next (status y `noindex` automáticos); la condicional duplicaría ramas y no emite el flujo 404. El `not-found` es autónomo (título + mensaje + "← Volver") porque reemplaza toda la página; no duplica el Header (RF-9/RF-12 no lo exigen). |
| 4 | **`getCurrentUser()` + redirect manual con `next`** en la página (RF-1) | Extender `requireUser(next?)` en `lib/session.ts` | Tocaría el flujo del dashboard sin necesidad; el `next` es particular de esta ruta. `requireUser` queda intacto. |
| 5 | **Validar `next` en la Server Action del login**: regex interna + existencia del código en BD → `redirect(next)`, si no → `redirect("/")` (CA-1.3) | (a) Redirigir a `next` sin validar → open redirect (constitución 5) y viola CA-1.3; (b) validar en la página tras login → el usuario aterrizaría en "no encontrado", no en el dashboard | R7 cumple CA-1.3 literal: solo lleva al apartamento si la dirección era válida. Usa `getApartments()` existente; si la BD falla en ese instante → fallback al dashboard. |
| 6 | **`try/catch` explícito SOLO alrededor de las consultas** + `data-error.tsx` con `router.refresh()` (RF-11) | `error.tsx` de segmento con `reset()` | El catch fino distingue "BD no responde" (RF-11) de un error de render (que no debe decir "no se pudieron cargar los datos"); además deja **fuera** a `redirect()` y `notFound()`, que si cayeran dentro del `try` serían atrapados por error. `router.refresh()` re-ejecuta el flujo completo sin cambiar de URL (CA-11.1, reintento libre). |
| 7 | **Filtro con estado local en componente cliente** (RF-6, RNF-9) | Filtro por `searchParams` en el servidor | Exigiría una navegación por cada cambio y más complejidad; la spec (decisión 14/Q1) admite estado de UI en el componente, igual que el dashboard actual. |
| 8 | **`lib/installments.ts` nuevo** para `buildPaymentRows` + `filterRowsByEstado`; `getUserApartmentSummary` en `lib/calculations.ts` (RF-6, RF-7, RF-8) | Meterlo todo en `calculations.ts` | `calculations.ts` documenta "cálculos automáticos"; el orden y el filtrado de filas es lógica de presentación (aunque pura y testeada). Dos archivos con responsabilidad clara, cada uno con sus tests (constitución 3). |
| 9 | **Quitar la columna "Apartamento"** en esta página y **ocultar columnas secundarias en móvil** (`hidden sm:table-cell`) (RF-4, RNF-3, RNF-4) | Mantener las mismas 7 columnas del dashboard | La página ES de un apartamento: la columna repite el mismo valor en todas las filas y empuja la tabla a scroll horizontal en móvil. Se conservan los MISMOS componentes (`Table`, `Badge`, `StatusBadge`) y estilos — RNF-4 habla de componentes y estilos, no de columnas. `overflow-x-auto` se descarta por RNF-3. |
| 10 | **`components/apartment/`** para los componentes nuevos (RF-5, RF-6, RF-7, RF-11) | Todo en `components/dashboard/` | La página no es el dashboard; separar evita mezclar responsabilidades. Se respeta el patrón de AGENTS (uno por archivo) y se reutilizan `ProgressBar`, `StatusBadge`, `Card`, `Table` y `Badge` (reglas 5 y 8). |
| 11 | **Eliminar `installments-section.tsx`** (RF-2.2) | Conservarlo sin uso | Código muerto: su funcionalidad la reemplaza la nueva tabla, que además suma los extras y quita el filtro de apartamento. |
| 12 | **Resumen propio de 3 datos** en vez de reusar `ApartmentCard` (RF-5) | Reusar la tarjeta del dashboard | La tarjeta incluye contadores ("X de Y pagadas") y datos extra que CA-5.1 no pide ("sin contador de cuotas"). Se reusan sus piezas (`ProgressBar`, `formatCOP`/`formatPercent`, tokens). |
| 13 | **Cero dependencias nuevas**: `next/link`, `next/navigation`, React state y shadcn ya instalados (RNF-6, constitución 1 y 4) | Instalar librerías (tablas, gráficas…) | Nada de lo pedido lo requiere; `recharts` sigue sin usarse (hallazgo conocido, fuera de alcance tocarlo). |
| 14 | **Tests con Vitest** vía `pnpm test` (§9) | `node --test` (lo pedía la plantilla original) | Confirmado por el usuario: AGENTS manda Vitest y el proyecto ya tiene 46 tests con ese runner — un solo runner mantiene la verificación de AGENTS en un paso. |

**RF cubiertos:** 12/12 (cada decisión está etiquetada con los RF que toca).

## 9. Estrategia de tests (Vitest)

Comandos de cierre (AGENTS): `pnpm test` → `pnpm build` → `pnpm lint` → E2E/DevTools. **Sin dependencias nuevas** (mismo runner).

### Unitarios (Vitest, junto a lo que prueban)

- **`lib/installments.test.ts` (nuevo)** — RF-6, RF-8:
  - `buildPaymentRows`: ambos tipos → extras primero; extras entre sí por fecha ascendente; cuotas por `numero` ascendente aunque lleguen desordenadas; tipos/ids correctos; solo cuotas; solo extras; arrays vacíos.
  - `filterRowsByEstado`: "todas" muestra todo; "pagada"/"pendiente" filtran cuotas; **las extras permanecen con cualquier filtro** (CA-8.3); filtro que deja 0 cuotas con extras presentes (caso 11); una cuota "pendiente" (antes "vencida") entra en "Pendientes" (caso 9).
- **`lib/calculations.test.ts` (extender)** — RF-4, RF-5, RF-7, RF-10:
  - `getUserApartmentSummary`: solo sus cuotas pagadas de ese apartamento + sus extras de ese apartamento; usuario con pagos en ambos apartamentos → solo los de este (CA-4.2, caso 5); solo extras → aparece con su total (CA-7.1); sin pagos → `tienePagos: false` (CA-7.2, caso 13); valores exactos.
  - `getApartmentSummary` (existente): verificar que cubre avance 100 % (caso 6), pagos > inicial (caso 7) e inicial 0 (caso 8); si falta alguno, añadirlo.
  - Fixture vacío (defensa): apartamento sin cuotas ni extras → resumen 0 y `tienePagos` falso (casos 12 y 13 a nivel de lógica).
- **Los 46 tests actuales** deben seguir verdes (ninguna regla de cálculo existente cambia).

### Integración

- **Composición "flujo de la página"** (un `describe` en los tests de `lib/`, con fixtures de `data/mock-data.ts`): reproducir el mismo orden que la página (alcance por apartamento → resumen → filas → usuarios) y afirmar el resultado completo: valores del resumen, orden exacto de filas, lista de usuarios del apartamento y — clave — que **el mismo código** acepte `101`/`202` y rechace `"101 "`, `""`, `"303"`, `"abc"` (RF-9 a nivel de lógica). Cubre RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10.
- **E2E por HTTP** (script temporal en `C:\Users\neanm\AppData\Local\Temp\opencode\`, patrón del `e2e-login.mjs` actual; `node` + `fetch`, sin dependencias) — RF-1, RF-2, RF-3, RF-9, RF-12:
  1. `/` sin cookie → redirect a `/login`.
  2. `/apartment/101` sin cookie → redirect a `/login?next=%2Fapartment%2F101` (CA-1.1).
  3. Login con `next` válido → aterriza en `/apartment/101` con datos (CA-1.3).
  4. Login con `next=/apartment/303` y con `next=https://…` → aterriza en `/` (CA-1.3 + constitución 5).
  5. `/apartment/101` con cookie → 200; contiene avance/pagado/pendiente; **extras antes que la primera cuota** en el HTML; filtros "Todas/Pagadas/Pendientes"; "← Volver"; sin columna "Apartamento".
  6. `/apartment/303` con cookie → "Apartamento no encontrado" + "← Volver" (RF-9, RF-12).
  7. Dashboard: sin sección de cuotas; cada tarjeta es `<a href="/apartment/101|202">` (RF-2).
- **Manual con DevTools MCP** (o pasos escritos si no está el MCP) — RF-11, RNF-3, RNF-4, RNF-8, casos 3 y 14:
  - Parar MySQL → abrir `/apartment/101` → "No se pudieron cargar los datos"; pulsar "Reintentar" 2 veces (sigue igual, sin límite); restaurar MySQL → "Reintentar" carga los datos.
  - Móvil (viewport angosto): sin scroll horizontal ni textos encimados (RNF-3); tema claro/oscuro y `prefers-reduced-motion` (RNF-4); recorrer la tarjeta con Tab + Enter y comprobar el estado activo del filtro (RNF-8).

### Cobertura de los 14 casos límite

| Caso | Verificación |
|---|---|
| 1 Dirección inválida | Unit (lógica del código) + E2E (6) |
| 2 Sin sesión | E2E (1, 2) |
| 3 BD caída | Manual (parar MySQL) + revisión de precedencias |
| 4 Sesión expira en uso | Razonado/manual (borrar cookie y recargar → login) |
| 5 Usuario en ambos aptos | Unit (`getUserApartmentSummary`) |
| 6 Avance 100 % | Unit (`getApartmentSummary`) |
| 7 Pagos > inicial | Unit (`getApartmentSummary`) |
| 8 Inicial 0 | Unit (`getApartmentSummary`) |
| 9 Vencida → pendiente | Unit (filtro) + revisión de `data/db.ts:145` (hoy: 0 filas vencidas) |
| 10 Sin extras | Unit (filas) — defensa, no manual |
| 11 Filtro → 0 cuotas | Unit (`filterRowsByEstado`) |
| 12 Sin cuotas con extras | Unit (fixtures) — defensa |
| 13 Sin pagos | Unit (resumen + usuarios) — defensa |
| 14 Reintento fallido | Manual (junto al caso 3) |

**RF cubiertos:** 12/12 — RF-1, 2, 3, 9, 12 por E2E + manual; RF-4, 5, 6, 7, 8, 10 por unit + integración; RF-11 por manual + revisión de código. Ningún RF sin verificación.

## 10. Riesgos, supuestos y preguntas abiertas

### Riesgos (con mitigación)

1. **Next 16 rompe patrones conocidos** (params como Promise, cookies en build, not-found) → mitigado: docs leídos (`dynamic-routes.md`, `not-found.md`) y se reutiliza el patrón ya probado del dashboard y del login.
2. **`redirect()`/`notFound()` atrapados dentro de un `try`** → el algoritmo los manda **fuera** de los dos `try` (§6); si se rompe, el síntoma sería "me manda al error en vez del login/no encontrado" — cubierto por E2E (1, 2, 6).
3. **`next` malicioso (open redirect)** → doble validación: regex al construir el enlace en la página y otra vez en la action antes de redirigir; E2E (4).
4. **`SESSION_SECRET` ausente** se vería como RF-11 en la página → supuesto: siempre definida en `.env.local` (hoy el dashboard fallaría igual).
5. **BD falla justo al validar `next` en el login** → fallback a `/` (dashboard); el dashboard con BD caída es comportamiento existente fuera de este spec.
6. **Quitar la sección de cuotas rompe checks del E2E actual** → actualizar el script de verificación en la misma etapa (§4.17).
7. **`notFound()` en streaming puede devolver HTTP 200** (con `noindex`) → la spec no exige 404; aceptado y documentado aquí.
8. **Móvil con 6 columnas** → columnas secundarias ocultas en pantallas angostas; la verificación RNF-3 es obligatoria.
9. **El `not-found` reemplaza toda la página** (no se verá el Header) → aceptado: RF-9/RF-12 solo exigen mensaje + "← Volver".

### Supuestos

- Solo existirán `101` y `202`, ambos con datos: los estados vacíos (CA-6.3, CA-7.3, CA-8.2, RF-10) son **defensa** y no se verifican a mano (decisión 7 de la spec).
- MySQL80 y `SESSION_SECRET` disponibles durante la verificación; los tests unitarios no dependen de la BD.
- `estado='vencida'` hoy tiene 0 filas; el mapeo a "pendiente" ya está en `data/db.ts:145` (no se toca la capa de datos).
- La "dirección" de la spec = segmento `/apartment/<codigo>`; la sesión y el login actuales no cambian salvo el campo `next`.
- Todo lo listado en "Fuera de alcance" de la spec sigue fuera (sin CRUD, exportaciones, gráficas ni nuevos apartamentos).

### Preguntas abiertas

**Ninguna.** La spec cerró su revisión QA sin dudas (15 decisiones) y este plan no abre decisiones nuevas fuera de la §8; cualquier cambio de ahí requiere actualizar primero la spec (constitución 2).

---

**Nota de implementación (etapas propuestas, metodología AGENTS):** la implementación futura se califica ~8/10 (16 archivos, datos reales, flujo de login) → se ejecuta por etapas aprobadas por separado, cada una verificable y con `pnpm test` + `pnpm build` + `pnpm lint` en verde:

1. **Lógica pura + tests:** `lib/installments.ts` (+ tests) y `getUserApartmentSummary` en `lib/calculations.ts` (+ tests). (RF-4/5/6/7/8/10 a nivel de lógica)
2. **Página y estados:** ruta `/apartment/[codigo]`, `not-found.tsx`, componentes de `components/apartment/`, RF-1 sin `next`, RF-9, RF-11, RF-12. (RF-1/3/4/5/6/7/8/9/10/11/12)
3. **Dashboard:** tarjeta clicable + retiro de la sección de cuotas + borrado de `installments-section.tsx`. (RF-2)
4. **Login `next`:** `searchParams` + campo oculto + validación en la action. (CA-1.3 completo)
5. **Verificación final:** E2E actualizado, DevTools (BD caída, móvil, teclado, tema), `MEMORY.md`.

**RF cubiertos:** 12/12 (cada etapa cierra los RF indicados; la trazabilidad completa está en §3).
