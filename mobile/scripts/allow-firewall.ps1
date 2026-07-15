# Opens TCP port 5000 (MuGate backend) for the phone to reach during development.
# Self-elevates to Administrator if needed.

$ruleName = "MuGate Backend 5000"
$port = 5000

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "Requesting administrator privileges..."
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    return
}

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Firewall rule '$ruleName' already exists. Nothing to do."
} else {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -Profile Private,Domain | Out-Null
    Write-Host "Created firewall rule '$ruleName' for TCP $port (Private + Domain)."
}

Write-Host "Done. You can close this window."
Start-Sleep -Seconds 3
