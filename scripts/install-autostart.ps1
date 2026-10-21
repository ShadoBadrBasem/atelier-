# Makes the Atelier start by itself: the app and the tunnel when you sign in to
# Windows, and a backup every night at 23:00. Run once:
#   powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
# Remove again with:  ... install-autostart.ps1 -Remove

param([switch]$Remove)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$names = "Atelier app", "Atelier tunnel", "Atelier backup"

foreach ($n in $names) {
  if (Get-ScheduledTask -TaskName $n -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $n -Confirm:$false
  }
}
if ($Remove) { Write-Host "Atelier auto-start removed."; return }

$ps = "powershell.exe"
$hidden = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File"
$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit 0 -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask -TaskName "Atelier app" -Trigger $logon -Settings $settings `
  -Action (New-ScheduledTaskAction -Execute $ps -Argument "$hidden `"$root\scripts\start-atelier.ps1`"" -WorkingDirectory $root) | Out-Null

$tunnelTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$tunnelTrigger.Delay = "PT30S" # give the app a head start
Register-ScheduledTask -TaskName "Atelier tunnel" -Trigger $tunnelTrigger -Settings $settings `
  -Action (New-ScheduledTaskAction -Execute $ps -Argument "$hidden `"$root\scripts\start-tunnel.ps1`"" -WorkingDirectory $root) | Out-Null

$nightly = New-ScheduledTaskTrigger -Daily -At 23:00
Register-ScheduledTask -TaskName "Atelier backup" -Trigger $nightly -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries) `
  -Action (New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c (if not exist logs mkdir logs) & npm run backup >> logs\backup.log 2>&1" -WorkingDirectory $root) | Out-Null

Write-Host "Done. The Atelier, its tunnel and nightly backups now start automatically."
