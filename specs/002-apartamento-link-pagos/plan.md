# Plan 002 — Vínculo de pagos con id y numeroInmueble (apartamento)

**Spec:** `specs/002-apartamento-link-pagos/spec.md`
**Constitución:** `docs/CONSTITUTION.md` (6 principios)
**Alcance:** plan de implementación **sin código**; cada sección indica qué RF cubre.
**Fuentes técnicas:** código actual del proyecto (`data/db.ts`, `lib/types.ts`, `app/apartment/[codigo]/page.tsx`), la spec y el plan 001.

---

## 1. Resumen de comprensión del problema

La página de cada apartamento ya existe (spec 001): resumen (avance %, pagado, pendiente), tabla de cuotas con filtro y usuarios. La spec 002 agrega **vender el vínculo de pago** que el negocio guardó en la tabla `apartamento`: un link visible que lleva a la página de pagos, junto con los datos para la consignación (`apto` e `inmueble`) a mano.

El href viene **de la BD en tiempo de ejecución** (columna `link_consignacion`); el valor de `numeroInmueble` llega nuevo desde `apartamento.numeroInmueble` y se muestra en una línea visible ("Apto: {id}", "Inmueble: {numero}", con "—" si no hay registrado).

## 2. Datos clave de la spec (confirmados por el usuario)

- **Columna de BD:** `link_consignacion` (en `apartamento`).
- **Columna SQL:** `apartamento.numeroInmueble`.
- **Parámetros del href:** `apto` (id del apartamento: `Apartment.id` = referenciaApto, "101"/"202") e `inmueble` (`numeroInmueble`); se unen con `&` si el link ya trae parámetros.
- **href:** valor de la BD leído en runtime — **no se hardcodea**.

## 3. Lista completa de RF

| RF | Requisito | CA | HU | Casos límite |
|---|---|---|---|---|
| RF-13 | Vínculo de pago del apartamento (link nativo, visible e interactivo; href del link de la BD) | 13.1–13.3 | HU-10 | — |
| RF-14 | Dato `numeroInmueble` en los datos del apartamento (`Apartment` + `getApartments` desde BD) | 14.1 | HU-10 | 2, 5 |
| RF-15 | Líneas visibles "Apto: {id del apartamento}" e "Inmueble: {numeroInmueble}" junto al vínculo | 15.1 | HU-10 | 2, 5 |
| RF-16 | Card "Pagar apartamento {codigo}" con el vínculo, las dos líneas y link visible (posición: después de `ApartmentSummary`, antes de `InstallmentsTable`) | 16.1 | HU-10 | 1, 2 |

**RF cubiertos:** 13/14/15/16 (fuente única: `specs/002-apartamento-link-pagos/spec.md`).

## 4. Matriz de trazabilidad RF → archivos / componentes / verificación

| RF | Archivos (§5) | Componentes/datos | Verificación (§9) |
|---|---|---|---|
| RF-13 | `data/db.ts`, `components/apartment/payment-link.tsx` | `getApartments`, `PaymentLink`, href dinámico | E2E/HTTP `/apartment/101`, `/apartment/202` |
| RF-14 | `data/db.ts`, `lib/types.ts` | `getApartments`, tipo `Apartment` | `pnpm build`; E2E: numero visible |
| RF-15 | `components/apartment/payment-link.tsx` | líneas "Apto: {id}" e "Inmueble: {numero|—}" | E2E: textos visibles |
| RF-16 | `app/apartment/[codigo]/page.tsx`, `components/apartment/payment-link.tsx` | render entre `ApartmentSummary` y `InstallmentsTable` | E2E/HTTP: orden en HTML |

**RF cubiertos:** 13/14/15/16 — cada RF tiene al menos una verificación obligatoria.

## 5. Archivos a crear o modificar y responsabilidad

### Crear

1. **`components/apartment/payment-link.tsx`** (nuevo, un archivo por componente — regla 5 AGENTS). Server Component: recibe `apartment: Apartment`. Renderiza la card con:
   - Titular: "Pagar apartamento {codigo}".
   - Línea visible "Apto: {id del apartamento}" y línea "Inmueble: {numeroInmueble ?? '—'}".
   - Link nativo (`next/link`) al href de la BD: `linkConsignacion` + parámetros `apto`/`inmueble` (`&` si ya tiene `?`).
   - **Sin `linkConsignacion` → sin render.**
   Reusa los componentes existentes: `Card/CardContent/CardHeader/CardTitle`, tokens del tema (`bg-card`, `text-foreground`, `border`, `focus-visible` ring como RNF-8 de 001). **Ninguna dependencia nueva.**

### Modificar

2. **`data/db.ts`** — añadir `apartamento.numeroInmueble` y `link_consignacion` al `SELECT` de `getApartments`; extender `ApartmentRow`; el `map` deja esos campos sin `null` (`?? undefined`); **sin cambios** en la firma (`getApartments(): Promise<Apartment[]>`), `getInstallments` ni ninguna otra query.
3. **`lib/types.ts`** — `Apartment` + `numeroInmueble?: number` y `linkConsignacion?: string` (opcionales para no inventar valores; el tipo lo suple la BD).
4. **`app/apartment/[codigo]/page.tsx`** — entre `<ApartmentSummary summary={resumen} />` y `<InstallmentsTable … />`, render: `<PaymentLink apartment={apartment} />`.

## 6. Estrategia de renderizado (patrón)

- **Server por defecto** (constitución 3): la card es un Server Component; la "interactividad" del link nativo es nativa del `<a>` de `next/link` (Tab + Enter sin `use client`).
- **Datos vivos desde BD:** href y numero leídos en runtime (RNF-11); no mock.
- **Tema (RNF-10):** solo tokens del tema; default oscuro; español visible.
- **Responsive:** card con texto corto, grid del tema; sin nuevos estilos fijos.

## 7. Decisiones técnicas justificadas y alternativa descartada

| # | Decisión | Alternativa descartada | Por qué |
|---|---|---|---|
| 1 | href **dinámico de la BD** (`linkConsignacion`), parámetros `apto`/`inmueble` confirmados por el usuario | hardcodear una URL | Datos reales deben llegar de `apartamento.link_consignacion`; construir el href del valor leído (CA-13.1, 13.2, 13.3). |
| 2 | **Fallbacks:** sin link → sin card; sin `numeroInmueble` → "—" (0 se muestra) | mostrar 0 o vínculo vacío | Defensa de RNF-11 + decisiones de la spec (casos 2 y 5). |
| 3 | Card en `components/apartment/` (un archivo por componente) | dentro de `apartment-summary.tsx` o page | Patrón regla 5 AGENTS; separación de responsabilidades. |
| 4 | 0 dependencias nuevas (MySQL ya en uso; `next/link` ya presente) | librería de enlaces o forms | Tipo de equipo sin rigidez; todo ya incluido. |

## 8. Estrategia de tests (Vitest)

- **Integridad de datos (RNF-11):** sin `linkConsignacion` → sin card; sin `numeroInmueble` → "—"; href = `link?apto={id}&inmueble={numero}`; link con parámetros previos → se añaden con `&`; `numeroInmuele=0` → se muestra 0 (casos 1–5). Esto en tests unitarios/de render si el proyecto ya los cubre (regla: tests a `lib/*.test.ts`, `data/*.test.ts`).
- **Verificación HTTP/E2E obligatoria de AGENTS:** `/apartment/101`, `/apartment/202` con sesión — el link es visible e interactivo, href = valor de BD, datos visibles, sin scroll horizontal en móvil, y sin sesión → login (RF-1 de 001).

## 9. Riesgos, supuestos y preguntas abiertas

1. **Riesgo (mínimo):** el `href` puede ser externo; no hay validación de dominio — es valor de BD legítimo del negocio, no parte de esta spec (fuera de alcance).
2. **Supuesto:** MySQL devuelve `link_consignacion`/`numeroInmueble` con esos nombres (el usuario confirmó la columna); sin fila → campos `undefined` (fallbacks de la spec).
3. **Supuesto:** el link ya trae parámetros → se unen con `&` (CA-13.3).
4. **No hay preguntas abiertas** (la spec cerró QA sin dudas).

---

**Nota de implementación (etapas propuestas, metodología AGENTS):** la implementación se califica ~6/10 (4 tareas, una entrega verificable por etapa) → ejecutarse por etapas aprobadas por separado, cada una verificable y con `pnpm test` + `pnpm build` + `pnpm lint` en verde.

**RF cubiertos:** 13/14/15/16.
