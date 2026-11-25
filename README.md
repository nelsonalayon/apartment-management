# Proyecto Elemental — control de cuota inicial

MVP para controlar el pago de la cuota inicial de dos apartamentos (101 y 202),
con login por PIN para 4 usuarios. Next.js 16 + MySQL local (`sistema_propiedad`).

**App en internet:** <https://desktop-vt0tpeg.tail3c231e.ts.net>
(URL estable; el PC debe estar encendido y con sesión iniciada).

## Desarrollo

```bash
pnpm dev      # desarrollo → http://localhost:3000
pnpm test     # tests (Vitest)
pnpm build    # build de producción (matar el puerto 3000 antes)
pnpm lint     # ESLint
pnpm start    # sirve el build de producción
```

Credenciales y `SESSION_SECRET` solo en `.env.local` (nunca en git).

## Operación (app pública)

### Arranque manual (autostart retirado)

Ejecuta PowerShell desde la raíz del proyecto. No hay que hacer cambios ni arreglar scripts.

1. **Tailscale en estado `Running`:** `& "C:\Program Files\Tailscale\tailscale.exe" status`. (Si está atorado, abre `tailscale-ipn.exe` — ver "Errores a evitar" en `MEMORY.md`.)
2. **Funnel:** `& "C:\Program Files\Tailscale\tailscale.exe" funnel 3000` — esto abre el túnel y genera la URL estable. Verifica con `tailscale funnel status` → `https://desktop-vt0tpeg.tail3c231e.ts.net`.
3. **App:** `pnpm start` (en `C:\cursos-ia\elementalIANextjs\elemental-app-ia`). Tarda ~20 s; comprobación:
   - `http://localhost:3000` → HTTP 200 (el dashboard "Control de cuota inicial")
   - `https://desktop-vt0tpeg.tail3c231e.ts.net` → HTTP 200 (misma app por el túnel)

Para detener la app: matar puerto 3000 + proceso `tailscale.exe funnel`.

Para el túnel por separado: `& "C:\Program Files\Tailscale\tailscale.exe" funnel stop`.

### Publicar a mano (sin tarea)
```powershell
pnpm start
& "C:\Program Files\Tailscale\tailscale.exe" funnel 3000
```
La URL nunca cambia: `https://desktop-vt0tpeg.tail3c231e.ts.net`.

### Parar la web
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-CimInstance Win32_Process -Filter "Name = 'tailscale.exe'" |
  Where-Object { $_.CommandLine -like "*funnel*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```
Para volver a levantarla: `Start-ScheduledTask -TaskName "ElementalApp-Publica"`.

### Si algo falla
| Síntoma | Qué mirar |
|---|---|
| No carga tras reiniciar el PC | `%TEMP%\elemental-start.log` (pasos del script) y `%TEMP%\elemental-pnpm.log` (errores de Next) |
| Local OK pero la URL pública no responde | busca `FAIL - URL publica` en el log → Tailscale atorado en `NoState`; el script ya intenta abrir su GUI solo, si no basta: abrir `tailscale-ipn.exe` a mano y relanzar la tarea |
| `EADDRINUSE` al ejecutar `pnpm start` | proceso `node` huérfano en el 3000 → matarlo (comando arriba) |
| 502/000 con la tarea en `Running` | no hay `node` en el 3000 → ver `elemental-pnpm.log` |
| "Demasiados intentos fallidos" | bloqueo de seguridad (5 PINs malos = 5 min); esperar o reiniciar el server |
| La tarea no existe (PC nueva) | recrearla con `Register-ScheduledTask` → ver `scripts/start-public.ps1` y `LEARNINGS.md` |

### Requisitos
- PC encendido con sesión iniciada (la tarea corre al logón).
- Servicio **Tailscale** (arranca con Windows) y **MySQL80** activos.
- El script `scripts/start-public.ps1` tiene rutas absolutas: si la carpeta del
  proyecto cambia, actualizarlas.

## Documentación del proyecto
- `AGENTS.md` — reglas de código y metodología de tareas complejas.
- `MEMORY.md` — estado actual, decisiones y errores a evitar.
- `LEARNINGS.md` — respuestas cortas a preguntas de código/conceptos.
