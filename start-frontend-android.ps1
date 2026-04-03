# Сборка и запуск Android app
Write-Host "=== Запуск Android App ===" -ForegroundColor Cyan

# Проверка Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js не найден в PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Переходу в frontend..." -ForegroundColor White
Set-Location "$PSScriptRoot\frontend"

# Проверка node_modules
if (!(Test-Path "node_modules")) {
    Write-Host "npm install не был запущен. Запускаю..." -ForegroundColor Yellow
    npm install
}

Write-Host "Убеждаюсь, что Metro запущен в отдельном терминале..." -ForegroundColor Cyan
Write-Host "Если Metro не запущен, запустите в другом терминале:" -ForegroundColor Yellow
Write-Host "  npm run start" -ForegroundColor White
Write-Host ""
Write-Host "Запускаю android app..." -ForegroundColor White
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

npm run android
