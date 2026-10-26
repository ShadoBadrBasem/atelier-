# Run every 5 minutes by the "Atelier watchdog" task. Restarts the app or the tunnel
# when they are not actually working (a stuck process counts as not working).

$port = if ($env:ATELIER_PORT) { $env:ATELIER_PORT } else { "3100" }

function Test-Url($url) {
  try { return (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10).StatusCode -eq 200 } catch { return $false }
}

function Restart-AtelierTask($name) {
  Stop-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  Start-ScheduledTask -TaskName $name
}

if (-not (Test-Url "http://localhost:$port/admin/login")) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Restart-AtelierTask "Atelier app"
  Start-Sleep -Seconds 60 # the tunnel needs the app
}

# cloudflared answers /ready with 200 only while connected to Cloudflare.
if (-not (Test-Url "http://127.0.0.1:20241/ready")) {
  Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
  Restart-AtelierTask "Atelier tunnel"
}
