$ErrorActionPreference = "Stop"

$addresses = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp |
  Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
  Select-Object -ExpandProperty IPAddress

if (-not $addresses) {
  Write-Error "No local network address found. Connect this computer and your phone to the same Wi-Fi network."
}

Write-Host "Open one of these URLs on your phone:" -ForegroundColor Cyan
$addresses | ForEach-Object { Write-Host "  http://$($_):3001" -ForegroundColor Green }
Write-Host ""
Write-Host "Keep this terminal running while you use the preview. Press Ctrl+C to stop it."
Write-Host ""

npm run dev -- --hostname 0.0.0.0 --port 3001