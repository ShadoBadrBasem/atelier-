# Starts the Atelier (website + admin) in production mode on this computer.
#   powershell -ExecutionPolicy Bypass -File scripts\start-atelier.ps1 [-Build]
# -Build rebuilds first (do this after pulling new code). Logs go to logs\app.log.
param([switch]$Build)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null
$port = if ($env:ATELIER_PORT) { $env:ATELIER_PORT } else { "3100" }

# Apply any new database migrations (never deletes data).
npx prisma migrate deploy

if ($Build -or -not (Test-Path "$root\.next\BUILD_ID")) {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed. The previous version was not replaced." }
}

Write-Host "The Atelier is running on http://localhost:$port (logs in logs\app.log)"
npx next start -p $port *>> "$root\logs\app.log"
