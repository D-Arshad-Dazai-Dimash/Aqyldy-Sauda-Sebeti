# Запуск Metro + Android App
Write-Host "=== Запуск Frontend (React Native Android) ===" -ForegroundColor Cyan

# Проверка Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js не найден в PATH" -ForegroundColor Red
    Write-Host "Установите Node.js 20+" -ForegroundColor Yellow
    exit 1
}

Write-Host "Переходу в frontend..." -ForegroundColor White
Set-Location "$PSScriptRoot\frontend"

# Проверка node_modules
if (!(Test-Path "node_modules")) {
    Write-Host "npm install не был запущен. Запускаю..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install завершился с ошибкой" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Запускаю Metro bundler..." -ForegroundColor White
Write-Host "В новом терминале выполните: npm run android" -ForegroundColor Cyan
Write-Host "Нажмите Ctrl+C для остановки Metro" -ForegroundColor Yellow
Write-Host ""

npm start
