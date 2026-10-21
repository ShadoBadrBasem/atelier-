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

if (Test-Path $config) {
  & $cf tunnel run $tunnel
} else {
  Write-Host "No named tunnel set up yet: opening a temporary address (look for trycloudflare.com below)."
  & $cf tunnel --url "http://localhost:$port"
}
