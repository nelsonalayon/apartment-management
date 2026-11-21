# scripts/start-public.ps1 — Etapa A4: levanta la app pública sola.
#
# Hace 4 cosas:
#   1. Libera el puerto 3000 (evita EADDRINUSE por procesos node huérfanos).
#   2. Espera a que Tailscale esté en estado "Running" (≤90 s). Si no llega,
#      abre la GUI `tailscale-ipn.exe` —fix del 21 nov 2026: destraba el
#      backend atorado en NoState— y vuelve a esperar (≤60 s).
#   3. Arranca `tailscale funnel 3000` si no está corriendo (URL estable) y
#      lanza un sondeo en segundo plano que escribe PASS/FAIL en el log
#      (primero localhost:3000, después la URL pública).
#   4. Ejecuta `pnpm start` (producción), con la salida a archivo para no
#      bloquearse en la ventana oculta de la tarea programada. El sondeo
#      corre mientras la app arranca (~20 s).
#
# Diagnóstico:
#   - $env:TEMP\elemental-start.log     → pasos del script + líneas [sondeo]
#   - $env:TEMP\elemental-pnpm.log      → salida de `pnpm start` (errores)
#   - Buscar "PASS" / "FAIL" en elemental-start.log para ver el estado real.
#
# Uso manual:  powershell -ExecutionPolicy Bypass -File scripts\start-public.ps1
# Lo ejecuta la tarea programada "ElementalApp-Publica" (con 1 min de espera
# tras el inicio de sesión, para esquivar la carga del arranque).

$ErrorActionPreference = "Stop"

$project = "C:\cursos-ia\elementalIANextjs\elemental-app-ia"
$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
$tailscaleGui = "C:\Program Files\Tailscale\tailscale-ipn.exe"
$pnpm = "$env:LOCALAPPDATA\pnpm\pnpm.CMD"
$urlPublica = "https://desktop-vt0tpeg.tail3c231e.ts.net"
$log = Join-Path $env:TEMP "elemental-start.log"
$pnpmLog = Join-Path $env:TEMP "elemental-pnpm.log"

function Log([string]$msg) {
  Add-Content -Path $log -Value ("{0} [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $PID, $msg)
}

# Estado real del backend de Tailscale: "Running", "NoState", "Starting"...
# (vacío si el comando falló). Antes se miraba solo "Logged out", que no
# detectaba el backend atorado en NoState (incidente 21 nov 2026).
function Get-TailscaleState {
  try {
    $json = & $tailscale status --json 2>$null | Out-String
    if ($json -match '"BackendState":\s*"(\w+)"') { return $Matches[1] }
  } catch { }
  return ""
}

Log "=== inicio del script ==="

try {
  # 1) Puerto 3000 libre -------------------------------------------------------
  Log "paso 1: liberando puerto 3000"
  Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
  Log "paso 1: listo"

  # 2) Tailscale en Running (con destrabe vía GUI si hace falta) --------------
  Log "paso 2: esperando a Tailscale (max 90s)"
  $estado = ""
  for ($i = 1; $i -le 30; $i++) {
    $estado = Get-TailscaleState
    if ($estado -eq "Running") { break }
    Start-Sleep -Seconds 3
  }

  if ($estado -ne "Running") {
    Log "paso 2: AVISO - BackendState=$estado; abriendo la GUI de Tailscale para destrabarlo"
    # Un funnel heredado de un backend roto puede quedar inservible: se mata
    # para que el paso 3 lance uno fresco contra el backend recuperado.
    Get-CimInstance Win32_Process -Filter "Name = 'tailscale.exe'" |
      Where-Object { $_.CommandLine -like "*funnel*" } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Start-Process -FilePath $tailscaleGui -ErrorAction SilentlyContinue
    for ($i = 1; $i -le 20; $i++) {
      Start-Sleep -Seconds 3
      $estado = Get-TailscaleState
      if ($estado -eq "Running") { break }
    }
  }

  if ($estado -eq "Running") {
    Log "paso 2: Tailscale Running"
  } else {
    Log "paso 2: ERROR - Tailscale quedo en '$estado' tras los reintentos; la URL publica NO funcionara"
  }

  $funnelCorriendo = Get-CimInstance Win32_Process -Filter "Name = 'tailscale.exe'" |
    Where-Object { $_.CommandLine -like "*funnel*" }
  if (-not $funnelCorriendo) {
    Start-Process -FilePath $tailscale -ArgumentList "funnel", "3000" -WindowStyle Hidden
    Log "paso 2: funnel 3000 lanzado"
  } else {
    Log "paso 2: funnel 3000 ya corria"
  }

  # 3) Sondeo PASS/FAIL en segundo plano ---------------------------------------
  # Corre mientras pnpm start arranca la app: primero localhost:3000 (valida
  # la app) y después la URL pública (valida Tailscale + funnel). El job vive
  # mientras viva este script (bloqueado en pnpm start).
  Log "paso 3: sondeo programado (local + publica, max ~3 min)"
  Start-Job -ScriptBlock {
    param($logFile, $publica)
    function LogS([string]$m) {
      Add-Content -Path $logFile -Value ("{0} [sondeo] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $m)
    }
    # 3a) app local (el arranque de Next tarda ~15-20 s)
    $localOk = $false
    for ($i = 1; $i -le 24; $i++) {
      try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $localOk = $true; break }
      } catch { }
      Start-Sleep -Seconds 5
    }
    if (-not $localOk) {
      LogS "FAIL - localhost:3000 no responde (mirar elemental-pnpm.log)"
      return
    }
    LogS "local OK (localhost:3000)"
    # 3b) URL pública (Tailscale + funnel + app)
    for ($i = 1; $i -le 18; $i++) {
      try {
        $r = Invoke-WebRequest -Uri $publica -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { LogS "PASS - URL publica OK ($publica)"; return }
      } catch { }
      Start-Sleep -Seconds 5
    }
    LogS "FAIL - URL publica sin responder ($publica); revisar Tailscale y funnel"
  } -ArgumentList $log, $urlPublica | Out-Null

  # 4) App en producción --------------------------------------------------------
  Log "paso 4: ejecutando pnpm start (pnpm existe=$(Test-Path $pnpm))"
  Set-Location $project
  Log "paso 4: llamando a pnpm (salida a $pnpmLog)"
  & $pnpm start *>> $pnpmLog
  Log "paso 4: pnpm start termino con codigo $LASTEXITCODE"
} catch {
  Log "ERROR: $($_.Exception.Message)"
  throw
}
