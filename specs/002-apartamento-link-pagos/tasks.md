# Tasks 002 — Vínculo de pagos con id y numeroInmueble (apartamento)

**Fuentes:** `specs/002-apartamento-link-pagos/spec.md` y `plan.md` (§5, §7).
**Reglas de este archivo:**
- Cada tarea es **una única acción técnica verificable** con su línea **"Hecho cuando:"** (criterio objetivo).
- Ordenadas **por dependencias**.
- **Verificación por etapa** (AGENTS + spec): `pnpm test`, `pnpm build`, `pnpm lint` en verde; para T05 también comprobación HTTP/E2E de `/apartment/101`, `/apartment/202` y móvil.

---

## Fase: Capa de datos y tipos

- [ ] **T01 — Data layer: SELECT de `link_consignacion` y `numeroInmueble` en `getApartments`** `RF-13, RF-14`
  - **Depende de:** —
  - **Acción:** en `data/db.ts`, añadir `apartamento.numeroInmueble` y `link_consignacion` al `SELECT` de `getApartments`; extender `ApartmentRow` con esos campos; el `map` deja los campos sin `null` (`?? undefined`).
  - **Hecho cuando:** `pnpm build` compila; `getApartments()` (runtime) devuelve `linkConsignacion` y `numeroInmueble`; `pnpm test` verde (`lib/calculations.test.ts` intacto); `git diff data/db.ts` muestra solo el SELECT y la interfaz de `ApartmentRow`; sin cambios en la firma, ni en `getInstallments`, `getExtraPayments`, `getUsers` ni en `CODIGOS_CORTOS`.

- [ ] **T02 — Tipos: campos opcionales en `Apartment`** `RF-14`
  - **Depende de:** T01
  - **Acción:** en `lib/types.ts`, añadir `numeroInmueble?: number` y `linkConsignacion?: string` a `Apartment`.
  - **Hecho cuando:** `pnpm build` compila; el tipo de `Apartment` incluye los dos campos opcionales; `git diff lib/types.ts` solo añade los campos (ningún otro tipo tocado).

## Fase: Componente

- [x] **T03 — Crear `components/apartment/payment-link.tsx` (Server)** `RF-13, RF-15, RF-16`
  - **Depende de:** T02
  - **Acción:** nuevo archivo (un archivo por componente), Server Component: recibe `apartment: Apartment`; si no hay `linkConsignacion` no renderiza nada; si hay, pinta la card "Pagar apartamento {codigo}" con el link nativo al href de la BD (`linkConsignacion` + `?apto={id}&inmueble={numero}`, o `&` si ya tiene `?`) y las líneas visibles "Apto: {id del apartamento}" e "Inmueble: {numeroInmueble ?? '—'}"; reusa `Card/CardContent/CardHeader/CardTitle` y tokens del tema.
  - **Hecho cuando:** `pnpm build` compila; sin link → sin render (sin card/href); href = valor de la BD sin hardcodear URL; líneas visibles en español.

## Fase: Página

- [x] **T04 — Render del componente en `app/apartment/[codigo]/page.tsx`** `RF-13, RF-16`
  - **Depende de:** T03
  - **Acción:** en `ApartmentContent`, entre `<ApartmentSummary summary={resumen} />` y `<InstallmentsTable … />`, render `<PaymentLink apartment={apartment} />`.
  - **Hecho cuando:** `pnpm build` compila; en HTML de `/apartment/101` el link de payment-link aparece **entre** el resumen y la tabla de cuotas; href tomado de la BD.

## Fase: Verificación final

- [x] **T05 — Comprobación HTTP/E2E de `/apartment/101`, `/apartment/202` y móvil** `RF-13, RF-14, RF-15, RF-16`
  - **Depende de:** T04
  - **Acción:** script temporal en `C:\Users\neanm\AppData\Local\Temp\opencode\` (patrón del `e2e-login.mjs`; `node` + `fetch`): `/apartment/101` y `/apartment/202` con cookie → 200; link visible e interactivo; href = valor de BD con `apto` e `inmueble`; click → URL de pagos; "Apto:"/"Inmueble:" visibles; sin sesión → login; móvil (viewport 360): sin scroll horizontal ni textos encimados, tokens del tema, español. Scripts: `e2e-apartments.mjs` (HTTP/E2E, usa PIN de la BD encontrado con `find-pin.mjs`) y `mobile-cdp.mjs` (Chrome headless + CDP a 360px).
  - **Hecho cuando:** script imprime los checks de `/apartment/101` y `/apartment/202` (link, href, datos visibles) + checks móviles; `pnpm test` verde (ejecutado en T05 de cierres); `pnpm build` sin errores TS; `pnpm lint` sin errores. Hallazgo real: en móvil hay overflow horizontal en la card de la tabla (detalle en MEMORY.md).

---

## Matriz RF → tareas (cobertura completa)

| RF | CA | Tareas | Estado |
|---|---|---|---|
| RF-13 — Vínculo de pago (13.1–13.3) | 13.1–13.3 | T01, T03, T04 | ☐ |
| RF-14 — `numeroInmueble` en datos | 14.1, 14.2 | T01, T02 | ☐ |
| RF-15 — Líneas "Apto:"/"Inmueble:" visibles | 15.1 | T03 | ☐ |
| RF-16 — Card "Pagar apartamento {codigo}" (posición) | 16.1 | T03, T04 | ☐ |

**4/4 RF con tareas asociadas** ☐ = pendiente.

### RNF → tareas (complemento)

| RNF | Tareas |
|---|---|
| RNF-10 — Estilo/tema (tokens del tema, español) | T03, T04 |
| RNF-11 — Datos de BD (sin mock, href vivo) | T04 |
