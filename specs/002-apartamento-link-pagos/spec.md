# Spec 002 — Vínculo de pagos con id y numeroInmueble (apartamento)

## Contexto y objetivo

La página de cada apartamento (`/apartment/[codigo]`, spec 001) muestra resumen, tabla de pagos y usuarios, pero no lleva al link de pago que se guardó en la base de datos. El usuario habló de un link que accede a la página de pagos, y para que la persona pueda hacer su consignación se necesitan el **id del apartamento** y el **numeroInmueble** "juntos" con ese vínculo. El valor `numeroInmueble` es una columna nueva que el usuario agregó a la tabla `apartamento`.

**Objetivo:** que, desde la página de un apartamento, el usuario tenga el vínculo de pago junto con su id y numeroInmueble listos para la consignación. Esta spec solo especifica; no se escribe código (plan/tasks vendrán tras la aprobación).

## Usuarios

Los mismos 4 usuarios con PIN (spec 001): acceso igual para todos los apartamentos (RF-1 de spec 001). El vínculo es visible para cualquiera que abre la página de ese apartamento.

## Historias de usuario

- **HU-10:** Como usuario, quiero ver en mi página de apartamento el vínculo de pago junto con su id y numeroInmueble, para tener los datos a la mano al hacer la consignación.

## Requisitos funcionales

**RF-13 — Vínculo de pago del apartamento**
- CA-13.1 (ubicuo): La página de cada apartamento deberá mostrar el vínculo de pago asociado a ese apartamento: el link guardado en la tabla `apartamento` en la columna `link_consignacion` (valor leído de la BD en tiempo de ejecución; no se hardcode).
- CA-13.2 (ubicuo): El vínculo deberá ser un elemento visible e interactivo que lleva a la página de pagos que define el href del link guardado en la columna `link_consignacion` (el href es el valor de esa columna leído en tiempo de ejecución; no se hardcode la URL).
- CA-13.3 (ubicuo): El href del vínculo deberá llevar a la mano los datos para la consignación: **id del apartamento** (Apartment.id = referenciaApto, "101"/"202") y **numeroInmueble** — parámetros confirmados por el usuario `apto={id}` e `inmueble={numeroInmueble}` (si el link ya trae parámetros, se unen con `&`).

**RF-14 — Dato numeroInmueble en los datos del apartamento**
- CA-14.1 (ubicuo): La página debe mostrar numeroInmueble del apartamento; `Apartment` (lib/types.ts) deberá incluirlo y `getApartments` (data/db.ts) lo devuelve desde la BD (columna SQL `apartamento.numeroInmueble`).
- CA-14.2 (no deseado): Si el apartamento no tiene numeroInmueble registrado, el sistema deberá mostrar "—" en vez de inventar un valor.

**RF-15 — Cómo se "juntan" los datos con el vínculo**
- CA-15.1 (ubicuo): Junto al vínculo de pago se mostrarán visibles las líneas **"Apto: {id del apartamento}"** e **"Inmueble: {numeroInmueble}"** (decisión de pantalla, revisable).

**RF-16 — Sección "Pagar apartamento" en la página**
- CA-16.1 (ubicuo): La página de cada apartamento mostrará una card "Pagar apartamento {codigo}" (reusando componentes shadcn/ui existentes y tokens del tema) con el vínculo de pago, las dos líneas de datos y un link visible al vínculo. Posición propuesta: después de `ApartmentSummary`, antes de `InstallmentsTable`.

## Requisitos no funcionales

- **RNF-10 — Estilo y tema:** tokens del tema (`bg-card`, `text-foreground`, `border`, etc.), default oscuro, sin colores fijos sin variante `dark:` (regla 9 de AGENTS.md). Sin dependencias nuevas (principio 1 de constitución); español visible; link nativo con `focus-visible` (RNF-8 de spec 001); responsive (grid `sm:`/`md:`/`lg:`).
- **RNF-11 — Integridad y datos:** datos vivos desde BD (data/db.ts, sin mock); nada calculado inventado; sin scroll horizontal en móvil ni textos encimados (RNF-3 de spec 001).

## Casos límite

1. Apartamento sin link en la columna `link_consignacion` → no se muestra la card del vínculo (defensa).
2. numeroInmueble null/vacío en BD → se muestra "—" en la línea "Inmueble"; el href sigue llevando `apto` (y `inmueble` si hay numeroInmueble).
3. Link sin parámetros previos → href = `link?apto={id}&inmueble={numeroInmueble}`.
4. Link con parámetros previos → se reusa y se añaden los nuevos con `&`.
5. numeroInmueble 0 → se muestra el 0 (no se oculta).

## Fuera de alcance (esta spec)

- Registro o actualización del link en la BD (se hace por Workbench; esta app solo lo muestra).
- Formularios de pago y backend de consignación (no está en alcance del MVP, spec 001).
- Dashboard, filtros y tabla de cuotas ya cubiertos por spec 001.
- Comparación entre apartamentos o avance global en esta página.

## Criterios de finalización

- Spec aprobada por el usuario (estándar de specs/001; sin huecos sin resolver; los datos confirmados del usuario: columna `link_consignacion`; href con `apto` e `inmueble`).
- RF-13/14/15/16 verificados en la página real (`/apartment/101`, `/apartment/202`): vínculo visible, href con `apto` + `inmueble`, click lleva a la URL de pagos, datos visibles; sin sesión → login (RF-1 de spec 001).
- RNF-10/11 verificados: visual en móvil y escritorio (sin scroll horizontal, tokens del tema).
- `pnpm test` en verde, `pnpm build` sin errores de TypeScript, `pnpm lint` sin errores (verificación obligatoria de AGENTS.md).
- MEMORY.md actualizado al cerrar la tarea.

## Decisiones de diseño

1. **Combinar datos y vínculo:** el href del vínculo lleva parámetros de consulta (confirmado por el usuario) y, junto al link, se muestran visibles "Apto: {id}" e "Inmueble: {numeroInmueble}".
2. **numeroInmueble en el tipo:** campo nuevo opcional `numeroInmueble?: number` en `Apartment` (lib/types.ts) + SELECT en `getApartments` (data/db.ts); tipo opcional para no inventar valores en el mock (fuente de los tests).
3. **Posición:** card "Pagar apartamento {codigo}" entre `ApartmentSummary` y `InstallmentsTable`.
4. **Fallbacks:** sin link → sin card; sin numeroInmueble → "—".
