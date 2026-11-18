# scripts/start-public.ps1 — Etapa A4: levanta la app pública sola.
#
# Hace 3 cosas:
#   1. Libera el puerto 3000 (evita EADDRINUSE por procesos node huérfanos).
#   2. Arranca `tailscale funnel 3000` si no está corriendo (URL estable).
#   3. Ejecuta `pnpm start` (producción) en primer plano.
#
# Uso manual:  powershell -ExecutionPolicy Bypass -File scripts\start-public.ps1
# Lo ejecuta la tarea programada "ElementalApp-Publica" al iniciar sesión.

$ErrorActionPreference = "Stop"

$project = "C:\cursos-ia\elementalIANextjs\elemental-app-ia"
$tailscale = "C:\Program Files\Tailscale\tailscale.exe"
$pnpm = "$env:LOCALAPPDATA\pnpm\pnpm.CMD"

# 1) Puerto 3000 libre -------------------------------------------------------
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# 2) Funnel de Tailscale (solo si aún no corre) ------------------------------
$funnelCorriendo = Get-CimInstance Win32_Process -Filter "Name = 'tailscale.exe'" |
  Where-Object { $_.CommandLine -like "*funnel*" }
if (-not $funnelCorriendo) {
  Start-Process -FilePath $tailscale -ArgumentList "funnel", "3000" -WindowStyle Hidden
  Write-Host "funnel 3000 lanzado"
} else {
  Write-Host "funnel 3000 ya corria"
}

# 3) App en producción (bloquea hasta que se detenga) ------------------------
Set-Location $project
& $pnpm start
