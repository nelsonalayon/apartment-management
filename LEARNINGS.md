# Learnings

Aprendizajes de preguntas de código/conceptos, añadidos automáticamente tras
cada pregunta. Regla: solo el stack del proyecto (React, Next.js, CSS/Tailwind,
TypeScript, tests), git y herramientas (pnpm, Vitest...). Nada de OpenCode,
logística ni conversación ajena al código.

**Plantilla de cada entrada** (máx. ~15 líneas):

- Título: la pregunta tal cual se hizo.
- **Por qué pasa / por qué importa:** respuesta corta de 2-3 líneas.
- **En el proyecto:** rutas reales relacionadas (opcional).
- **Prueba:** comando o snippet de 1-2 líneas para experimentar (opcional).
- **Ver más:** 2-3 enlaces oficiales verificados (siempre que aplique).

## ¿Por qué mi sitio se queda en claro aunque el navegador está en oscuro?

**Por qué pasa:** el navegador solo *señala* su preferencia
(`prefers-color-scheme`); el sitio debe estar construido para reaccionar
(media query CSS o clase `.dark`). Un sitio solo-claro se queda claro siempre.
El botón propio (clase en `<html>` + localStorage) da control por sitio y
sobreescribe la preferencia del sistema.

- **En el proyecto:** `components/dashboard/theme-toggle.tsx` (los 3 estados:
  Sistema/Claro/Oscuro) y `app/layout.tsx` (ThemeProvider + script anti-FOUC).
- **Prueba:** en la consola del navegador →
  `matchMedia('(prefers-color-scheme: dark)').matches` devuelve `true`/`false`.
- **Ver más:** [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme)
  · [next-themes (GitHub)](https://github.com/pacocoursey/next-themes)

## ¿Qué es una TUI?

**Por qué importa:** *Text-based User Interface* — una interfaz interactiva
dibujada en la terminal (paneles, menús y atajos de teclado, sin ratón ni
ventanas gráficas). A diferencia de la CLI (escribes un comando y termina),
la TUI es una pantalla viva que se navega con el teclado.

- **Prueba:** corre `pnpm exec vitest` en este proyecto → el watch mode de
  Vitest es una TUI real (flechas para navegar, `q` para salir).
- **Ver más:** [Wikipedia: Text-based user interface](https://en.wikipedia.org/wiki/Text-based_user_interface)
  · [Vitest: Watch Mode](https://vitest.dev/guide/features#watch-mode)

## ¿Qué es YAML?

**Por qué importa:** *YAML Ain't Markup Language* — formato de texto para
escribir datos y configuración legibles por humanos (`clave: valor`, listas
con `-`, anidado por sangría con espacios). Se usa en frontmatter de Markdown,
`opencode.json`, GitHub Actions, docker-compose... Casi cualquier `:` o mala
sangría lo rompe: valores con `:` o saltos de línea suelen requerir comillas.

- **En el proyecto:** frontmatter de `.agents/skills/local-dates/SKILL.md`
  (`name`, `description`) y `opencode`/`next.config.ts` (este, TypeScript).
- **Prueba:** pegar un fragmento en https://play.yaml.com y romperlo a propósito
  (agregar `:` y un salto de línea) para ver el error.
- **Ver más:** [yaml.org (oficial)](https://yaml.org/) · [YAML Playground](https://play.yaml.com)
  · [MDN: YAML](https://developer.mozilla.org/en-US/docs/Glossary/YAML)

## ¿Qué es E2E HTTP?

**Por qué importa:** E2E = *End-to-End*: prueba del flujo completo de un
usuario real a través de todas las capas (cliente → servidor → BD). La variante
"por HTTP" hace ese flujo hablando directamente con el servidor (`fetch`/`curl`)
en vez de con un navegador: se comprueban redirects, cookies y el HTML de la
respuesta, sin JS del cliente. Más ligero que Playwright, pero no verifica lo
visual.

- **En el proyecto:** verificación del login con un script temporal fuera del
  repo (15 checks: `/` protegida, PIN correcto/incorrecto, cookie de 30 días,
  logout) — ruta protegida `app/page.tsx`, actions en `app/actions/auth.ts`.
- **Prueba:** `curl -i http://localhost:3000/` sin sesión → verás
  `location: /login` (o el meta refresh del streaming en rutas con `<Suspense>`).
- **Ver más:** [Playwright: end-to-end testing](https://playwright.dev/docs/intro)
  · [MDN: HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
