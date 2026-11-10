# Memoria del proyecto

## Estado actual
- MVP funcional: dashboard de cuota inicial (2 apartamentos, 4 usuarios, 20 cuotas) con datos mock. Último commit: dark mode + tests + docs.
- Tests Vitest: 22/22 (`pnpm test`) — cálculos, formato, integridad de datos.
- Modo oscuro AÑADIDO: 3 estados (Sistema/Claro/Oscuro) con `next-themes`, default **oscuro**, botón en Header.
- `formatCOP` corrige el NBSP de Intl → "$75.000.000" exacto.
- `LEARNINGS.md` (nombre en inglés, regla nueva): se llena solo tras cada pregunta de código/conceptos; las preguntas ajenas al código no se guardan.

## Decisiones importantes (y por qué)
- Sin backend, auth ni DB por ahora (decisión original): el objetivo es un producto mostrable; los datos mock se reemplazarán por una API después.
- Todo cálculo deriva de `data/mock-data.ts`; nunca guardar valores calculados.
- Server Component + un solo `"use client"` (`installments-section`, `theme-toggle` por estado).
- Sin librerías de gráficas: barras con `div` + Tailwind.
- `next-themes` (excepción justificada a "sin dependencias"): anti-FOUC + estándar shadcn. Config: `attribute="class" defaultTheme="dark" enableSystem`.
- Botón de tema usa `useSyncExternalStore` (no `useState`+effect) → pasa la regla `react-hooks/set-state-in-effect`.
- Colores amber con variantes `dark:` explícitas (badge pendiente y valor pendiente).

## Errores a evitar
- Hidratación (2 errores vistos en consola): (1) `<html>` necesita `suppressHydrationWarning` cuando next-themes pone `class="dark"` antes de hidratar; (2) en el toggle, TODO lo que depende del tema (icono, aria-label, title) debe esperar a `montado`, no solo el icono.
- `useEffect(() => setMounted(true))` → ERROR de lint (`react-hooks/set-state-in-effect`). Usar `useSyncExternalStore`.
- Asumir formato de Intl sin probarlo: es-CO da "$ 75.000.000" (NBSP) y fecha "15 de ene de 2026".
- Chequeos HTML con entidades UTF-8 → falsos negativos; leer `RawContentStream` como UTF8.
- Matar el servidor del puerto 3000 antes de `pnpm build` (si no, sirve build viejo o choca).
- El bloque `nextjs-agent-rules` de AGENTS.md lo re-escribe `next dev`: no quitarlo del diff.
- OpenCode: si la sesión nace en la carpeta padre, NO descubre `.opencode/commands/` del proyecto (solo mira desde el cwd hacia arriba). Abrir OpenCode desde `elemental-app-ia`.
