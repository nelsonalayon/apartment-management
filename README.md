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

### Arranque automático
Al iniciar sesión en Windows, la tarea programada **`ElementalApp-Publica`**
(`Win + R` → `taskschd.msc`) ejecuta `scripts/start-public.ps1`, que:

1. libera el puerto 3000 (procesos `node` huérfanos),
2. espera a que Tailscale esté listo (≤90 s) y lanza `tailscale funnel 3000`,
3. arranca `pnpm start` (producción).

No hay que hacer nada: ~1 min tras iniciar sesión la URL está viva.

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
