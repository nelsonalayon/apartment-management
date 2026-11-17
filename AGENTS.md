# Instrucciones del proyecto

## Comandos

- `pnpm dev` — desarrollo con recarga en vivo → http://localhost:3000
- `pnpm build` — build de producción (verificar siempre que compile)
- `pnpm start` — sirve el build de producción
- `pnpm lint` — ESLint (verificar después de escribir código)

## Estructura

Proyecto: MVP para controlar el pago de la cuota inicial de dos apartamentos (101 y 202) con 4 usuarios que inician sesión con PIN. Datos reales desde MySQL local (Workbench); sin API REST: el login usa Server Actions + cookie firmada.

```
app/                    → App Router; page.tsx es el dashboard (Server Component)
app/login/              → página de login (Server Component + Suspense)
app/actions/auth.ts     → Server Actions de login/logout
components/dashboard/   → componentes propios del dashboard
components/login/       → formulario de login (cliente)
components/ui/          → componentes shadcn/ui (no editar salvo necesidad)
data/db.ts              → capa de datos MySQL (pool + consultas; ÚNICA fuente en runtime)
data/mock-data.ts       → datos mock (solo fixture de los tests)
lib/types.ts            → tipos compartidos (Apartment, User, Installment, ExtraPayment)
lib/calculations.ts     → funciones puras de cálculo
lib/format.ts           → formatCOP, formatPercent, formatDate
lib/auth.ts             → PINs (scrypt) y firma HMAC de sesión (puro, con tests)
lib/session.ts          → cookie de sesión (SESSION_SECRET en .env.local)
components/dashboard/theme-toggle.tsx → botón Sistema/Claro/Oscuro (next-themes)
LEARNINGS.md            → aprendizajes de preguntas de código (plantilla en español)
scripts/db-diagnostic.mjs → muestra el esquema real de la BD (node scripts/db-diagnostic.mjs)
scripts/set-pins.mts    → crea persona.pin_hash y asigna PINs (node scripts/set-pins.mts [--reset])
```

## Reglas de código

1. **Datos separados de la UI:** los datos reales viven en `data/db.ts` (consultas MySQL que devuelven los tipos de `lib/types.ts`); los componentes no cambian. Si se cambia de BD/API, se reemplaza solo `data/db.ts`. Credenciales solo en `.env.local` (nunca en git ni en documentación).
2. **Todo cálculo se deriva de las cuotas y los extras:** pagado = suma de cuotas pagadas + pagos_adicionales (`pagos_adicionales` SÍ cuentan; las pendientes nunca entran); pendiente = cuota inicial − pagado (mín. 0); avance = pagado / inicial × 100 con tope de 100%. Nunca guardar valores calculados.
3. **Formato:** dinero siempre con `formatCOP` (ej: `$75.000.000`), porcentajes con `formatPercent` (máx. 2 decimales), fechas con `formatDate`.
4. **Server/Client Components:** las páginas son Server Components por defecto (calculan en el servidor y pasan props). Agregar `"use client"` solo cuando haya estado, efectos o manejadores de eventos (como los filtros de `installments-section.tsx`).
5. **Componentes pequeños:** uno por archivo en `components/dashboard/`, reutilizando `ProgressBar`, `StatusBadge` y los componentes shadcn.
6. **Sin dependencias nuevas** sin justificarlo explícitamente. No hay librerías de gráficas: las barras de progreso son `div` + Tailwind.
7. **Alcance del MVP:** no agregar backend/API REST, formularios de pagos, notificaciones, exportaciones ni funcionalidades no solicitadas. El login de los 4 usuarios está en alcance (solicitado el 14 nov 2026): Server Actions + cookie firmada, PINs con hash scrypt en `persona.pin_hash`.
8. **Estilo:** usar shadcn/ui y las clases existentes del tema (zinc + emerald). Diseño responsive (grids `sm:`/`md:`/`lg:`).
9. **Tema oscuro:** el selector está en el Header (`theme-toggle.tsx`) con 3 estados (Sistema/Claro/Oscuro) vía `next-themes` — default "oscuro". Usar siempre los tokens del tema (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`...); **prohibido** colores fijos (`bg-white`, `text-amber-600`...) sin su variante `dark:`. `next-themes` es la excepción justificada a la regla 6 (anti-parpadeo + estándar shadcn).
10. **Nombres de archivo en inglés** (ej: `LEARNINGS.md`, no `Aprendizajes.md`). `MEMORY.md` y `AGENTS.md` ya cumplen.

## Forma de trabajar

- haz solo lo que se te pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados: no reescribas lo que ya funciona.
- Al terminar, resume que has cambiado y cualquier decisión que deba revisar.

## Metodología de tareas complejas

**Calificación (escala 1-10, tope 10).** Al recibir una tarea no trivial, el
agente la califica con 5 criterios: alcance (archivos/páginas afectados),
riesgo (datos reales, seguridad), dependencias externas (BD, red, servicios),
incertidumbre (camino explorado) y esfuerzo de verificación. Se comunica la
calificación al usuario. Si la tarea supera el 10, se otorga 10 (tope).
- **1-3:** ejecutar directamente.
- **4-5:** proponer el enfoque en 1-2 frases y ejecutar.
- **6-9:** NO tocar código hasta dividirla en etapas y que el usuario apruebe
  el plan (objetivo + verificación de cada etapa).
- **10 = ALERTA:** no se intenta hacer de una. Primero se descompone en
  tareas pequeñas e independientes (cada una se califica de nuevo y debería
  quedar por debajo de 10), y solo entonces se ejecutan una a una.

**Criterios de división:**
1. Cada etapa = una entrega verificable de extremo a extremo (se prueba sola).
2. Cada etapa = 1 commit revisible, con el mínimo de archivos posible.
3. El repo nunca queda roto: al cerrar cada etapa pasan test, build y lint.
4. Orden: primero lo que desbloquea lo demás; incertidumbre y riesgo antes
   que pulido.
5. Independencia: cada tarea pequeña se ejecuta, verifica y cierra por
   separado; su verificación no depende de que continúe la siguiente.

**Ejecución, una etapa a la vez:**
1. Implementar solo la etapa actual.
2. Verificar: suite + comprobación funcional de la etapa (regla 4).
3. Pedir revisión y aprobación al usuario.
4. Commit (push solo si lo pide) → siguiente etapa. Actualizar MEMORY.md al
   cerrar cada etapa si hay decisiones nuevas, y siempre al cerrar la tarea.

Ejemplos: cambiar una clase = 1 · fix de estilo = 2 · bug acotado = 4-5 ·
login completo = 9 · publicar en internet = 9 · migrar la BD a la nube = 10
(alerta: descomponer primero).

## Memoria
- Al empezar, lee 'MEMORY.md' para conocer el estado del proyecto y las decisiones tomadas.
- Al terminar una tarea, actualizalo: estado actual, decisiones importantes (con su por qué) y errores a evitar.
- Mantenlo breve (Máximo ~50 líneas). Resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a 'AGENTS.md' en lugar de dejarlo en la memoria. 
- Tras una pregunta de código/conceptos (stack, git, herramientas), añade una entrada breve en `LEARNINGS.md` automáticamente **siguiendo su plantilla** (título-pregunta, respuesta corta, "En el proyecto", "Prueba" y "Ver más" con enlaces oficiales verificados; contenido en español). No guardes preguntas ajenas al código (OpenCode, logística, conversación).
- No guardes nunca datos sensibles (Claves, tokens, datos personales...)

## Limites

- Siempre: Actualizar `MEMORY.md` al terminar cada tarea.

## Verificación

Orden obligatorio al terminar cada tarea:

1. `pnpm test` — tests unitarios (Vitest) de cálculos, formato e integridad de los datos mock.
2. `pnpm build` — debe compilar sin errores de TypeScript.
3. `pnpm lint` — sin errores de ESLint.
4. Verifica la funcionalidad con el MCP de Chrome DevTools si está disponible (verifica en `opencode.json` que la sesión arranque en la carpeta del proyecto); si no lo está, con una **verificación E2E por HTTP** (script temporal fuera del repo: redirects, acciones, cookies y HTML de respuesta) más la revisión de la consola del dev server. En ambos casos: prueba la funcionalidad y comprueba la vista móvil.

Si algo falla, corrige antes de terminar. Los tests viven junto a lo que prueban (`lib/*.test.ts`, `data/*.test.ts`); si cambias una regla de cálculo o formato, actualiza o añade el test que la cubra.




<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
