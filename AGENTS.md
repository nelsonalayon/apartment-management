# Instrucciones del proyecto

## Comandos

- `pnpm dev` — desarrollo con recarga en vivo → http://localhost:3000
- `pnpm build` — build de producción (verificar siempre que compile)
- `pnpm start` — sirve el build de producción
- `pnpm lint` — ESLint (verificar después de escribir código)

## Estructura

Proyecto: MVP para controlar el pago de la cuota inicial de dos apartamentos (101 y 202) con 4 usuarios. Solo datos mock, sin backend, autenticación ni base de datos.

```
app/                    → App Router; page.tsx es el dashboard (Server Component)
components/dashboard/   → componentes propios del dashboard
components/ui/          → componentes shadcn/ui (no editar salvo necesidad)
data/mock-data.ts       → ÚNICA fuente de datos (apartamentos, usuarios, cuotas)
lib/types.ts            → tipos compartidos (Apartment, User, Installment)
lib/calculations.ts     → funciones puras de cálculo
lib/format.ts           → formatCOP, formatPercent, formatDate
components/dashboard/theme-toggle.tsx → botón Sistema/Claro/Oscuro (next-themes)
LEARNINGS.md            → brief answers to code questions
```

## Reglas de código

1. **Datos separados de la UI:** todos los datos viven en `data/mock-data.ts`. Para conectar una API en el futuro, se reemplaza ese archivo sin tocar los componentes (respetando los tipos de `lib/types.ts`).
2. **Todo cálculo se deriva de las cuotas:** pagado = suma de cuotas pagadas (las pendientes nunca entran); pendiente = cuota inicial − pagado; avance = pagado / inicial × 100 con tope de 100%. Nunca guardar valores calculados en datos mock.
3. **Formato:** dinero siempre con `formatCOP` (ej: `$75.000.000`), porcentajes con `formatPercent` (máx. 2 decimales), fechas con `formatDate`.
4. **Server/Client Components:** las páginas son Server Components por defecto (calculan en el servidor y pasan props). Agregar `"use client"` solo cuando haya estado, efectos o manejadores de eventos (como los filtros de `installments-section.tsx`).
5. **Componentes pequeños:** uno por archivo en `components/dashboard/`, reutilizando `ProgressBar`, `StatusBadge` y los componentes shadcn.
6. **Sin dependencias nuevas** sin justificarlo explícitamente. No hay librerías de gráficas: las barras de progreso son `div` + Tailwind.
7. **Alcance del MVP:** no agregar login, backend, formularios de pagos, notificaciones, exportaciones ni funcionalidades no solicitadas.
8. **Estilo:** usar shadcn/ui y las clases existentes del tema (zinc + emerald). Diseño responsive (grids `sm:`/`md:`/`lg:`).
9. **Tema oscuro:** el selector está en el Header (`theme-toggle.tsx`) con 3 estados (Sistema/Claro/Oscuro) vía `next-themes` — default "oscuro". Usar siempre los tokens del tema (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`...); **prohibido** colores fijos (`bg-white`, `text-amber-600`...) sin su variante `dark:`. `next-themes` es la excepción justificada a la regla 6 (anti-parpadeo + estándar shadcn).
10. **Nombres de archivo en inglés** (ej: `LEARNINGS.md`, no `Aprendizajes.md`). `MEMORY.md` y `AGENTS.md` ya cumplen.

## Forma de trabajar

- haz solo lo que se te pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados: no reescribas lo que ya funciona.
- Al terminar, resume que has cambiado y cualquier decisión que deba revisar.

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

Si algo falla, corrige antes de terminar. Los tests viven junto a lo que prueban (`lib/*.test.ts`, `data/*.test.ts`); si cambias una regla de cálculo o formato, actualiza o añade el test que la cubra.




<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
