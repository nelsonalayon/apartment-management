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

## ¿Cómo publicar una app local en internet con Cloudflare Tunnel?

**Por qué importa:** un túnel (`cloudflared`) inicia una conexión *saliente*
hacia Cloudflare y recibe ahí una URL **HTTPS**; el tráfico baja al
`localhost:3000`. No abres puertos en el router/firewall, no necesitas IP fija
ni CGNAT — pero el PC debe estar encendido y la URL del *quick tunnel* es
efímera.

- **En el proyecto:** Etapa A1 (ruta al internet): binario portable en
  `%LOCALAPPDATA%\cloudflared\` (fuera del repo); el login funciona sin tocar
  código porque la cookie `secure` de `lib/session.ts` es válida sobre HTTPS.
- **Cuánto dura:** la URL vive mientras corre `cloudflared`, pero Cloudflare
  **no garantiza uptime** y el hostname es nuevo en cada arranque (es una URL
  de *testing*; en nuestras pruebas caducó a las ~2 h con `Tunnel not found`).
- **Prueba:** `cloudflared tunnel --url http://localhost:3000` → copia la URL
  `https://xxx.trycloudflare.com` y ábrela desde el celular con datos móviles.
- **Barrera extra sin código (solo quick tunnels):** `--allowed-mail 'a@x,b@y'`
  pide un código de un solo uso enviado al correo antes de cargar la app; no
  toca la BD ni el login propio (los PIN siguen igual), pero bloquea los
  scripts E2E (clientes no interactivos).
- **Ver más:** [Cloudflare: TryCloudflare](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)
  · [repo cloudflared (GitHub)](https://github.com/cloudflare/cloudflared)

## ¿Tailscale y Cloudflare son lo mismo?

**Por qué importa:** son empresas con propósitos distintos — Cloudflare es
infraestructura de la **internet pública** (CDN, DNS, DDoS) y Tailscale es una
**red privada tipo VPN** (WireGuard) para unir tus dispositivos. Coinciden solo
en su "tunnel": los dos publican un servicio local con una URL HTTPS saliendo
desde tu PC sin abrir puertos. Diferencia práctica: el quick tunnel de
Cloudflare es efímero (URL nueva por reinicio) y el Funnel de Tailscale da
URL estable gratis, pero exige cuenta.

- **En el proyecto:** A1 usó el quick tunnel de Cloudflare; A3 migró al
  Funnel de Tailscale (`https://<equipo>.<tailnet>.ts.net`), estable.
- **Prueba:** `tailscale funnel 3000` → imprime la URL `*.ts.net` y la
  mantiene aunque reinicies el PC (con el servicio de Tailscale activo).
- **Ver más:** [Tailscale (oficial)](https://tailscale.com/)
  · [Tailscale: Funnel](https://tailscale.com/kb/1223/funnel)
  · [Cloudflare: Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)

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
