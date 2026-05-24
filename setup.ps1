# ScreenLog Setup Script
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "d:\edge download\电脑监控\screenlog"
Write-Host "Installing dependencies..."
npm install
