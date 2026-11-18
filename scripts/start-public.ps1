# scripts/start-public.ps1 — Etapa A4: levanta la app pública sola.
#
# Hace 3 cosas:
#   1. Libera el puerto 3000 (evita EADDRINUSE por procesos node huérfanos).
#   2. Espera a que Tailscale esté listo y arranca `tailscale funnel 3000`
#      si no está corriendo (URL estable).
#   3. Ejecuta `pnpm start` (producción), con la salida a archivo para no
#      bloquearse en la ventana oculta de la tarea programada.
#
# Diagnóstico:
#   - $env:TEMP\elemental-start.log     → pasos del script (dónde se para)
#   - $env:TEMP\elemental-pnpm.log      → salida de `pnpm start` (errores)
#
# Uso manual:  powershell -ExecutionPolicy Bypass -File scripts\start-public.ps1
# Lo ejecuta la tarea programada "ElementalApp-Publica" (con 1 min de espera
# tras el inicio de sesión, para esquivar la carga del arranque).

$ErrorActionPreference = "Stop"

$project = "C:\cursos-ia\elementalIANextjs\elemental-app-ia"
$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
$pnpm = "$env:LOCALAPPDATA\pnpm\pnpm.CMD"
$log = Join-Path $env:TEMP "elemental-start.log"
$pnpmLog = Join-Path $env:TEMP "elemental-pnpm.log"

function Log([string]$msg) {
  Add-Content -Path $log -Value ("{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $PID, $msg)
}

Log "=== inicio del script ==="

try {
  # 1) Puerto 3000 libre -------------------------------------------------------
  Log "paso 1: liberando puerto 3000"
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
  Log "paso 1: listo"

  # 2) Funnel de Tailscale (espera a que el servicio esté listo) ---------------
  Log "paso 2: esperando a Tailscale (max 90s)"
  $listo = $false
  for ($i = 1; $i -le 30; $i++) {
    $status = & $tailscale status 2>$null
    if ($LASTEXITCODE -eq 0 -and $status -notmatch "Logged out") { $listo = $true; break }
    Start-Sleep -Seconds 3
  }
  if (-not $listo) { Log "paso 2: AVISO - tailscale no respondio en 90s; se intenta igual" }

  $funnelCorriendo = Get-CimInstance Win32_Process -Filter "Name = 'tailscale.exe'" |
    Where-Object { $_.CommandLine -like "*funnel*" }
  if (-not $funnelCorriendo) {
    Start-Process -FilePath $tailscale -ArgumentList "funnel", "3000" -WindowStyle Hidden
    Log "paso 2: funnel 3000 lanzado"
  } else {
    Log "paso 2: funnel 3000 ya corria"
  }

  # 3) App en producción --------------------------------------------------------
  Log "paso 3: ejecutando pnpm start (pnpm existe=$(Test-Path $pnpm))"
  Set-Location $project
  Log "paso 3: llamando a pnpm (salida a $pnpmLog)"
  & $pnpm start *>> $pnpmLog
  Log "paso 3: pnpm start termino con codigo $LASTEXITCODE"
} catch {
  Log "ERROR: $($_.Exception.Message)"
  throw
}
