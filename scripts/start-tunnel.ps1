# Puts the Atelier on the internet through Cloudflare Tunnel.
#   powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1
# With a named tunnel (see docs/HOSTING.md) it uses your own address, e.g. atelier.shadobadr.com.
# Without one it opens a temporary https://….trycloudflare.com address that changes on every start.

$ErrorActionPreference = "Stop"
$port = if ($env:ATELIER_PORT) { $env:ATELIER_PORT } else { "3100" }
$tunnel = if ($env:ATELIER_TUNNEL) { $env:ATELIER_TUNNEL } else { "atelier" }
$config = Join-Path $env:USERPROFILE ".cloudflared\config.yml"

# winget installs it here; a new PATH entry only reaches shells opened after the install.
$cf = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cf) { $cf = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe" }

$root = Split-Path -Parent $PSScriptRoot
New-Item -ItemType Directory -Force -Path "$root\logs" | Out-Null
$log = "$root\logs\tunnel.log"
Remove-Item $log -ErrorAction SilentlyContinue # fresh log, so the current address is easy to find

if (Test-Path $config) {
  & $cf tunnel --no-autoupdate --logfile $log run $tunnel
} else {
  Write-Host "No named tunnel set up yet: opening a temporary address (its trycloudflare.com address is in logs\tunnel.log)."
  & $cf tunnel --no-autoupdate --logfile $log --url "http://localhost:$port"
}
