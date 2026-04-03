# Запуск PostgreSQL через Docker Compose
Write-Host "=== Запуск PostgreSQL (Docker) ===" -ForegroundColor Cyan

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker не найден в PATH" -ForegroundColor Red
    Write-Host "Установите Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "Запускаю docker compose..." -ForegroundColor White
docker compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL запущен" -ForegroundColor Green
    Start-Sleep -Seconds 3
    Write-Host ""
    Write-Host "Параметры БД:" -ForegroundColor Cyan
    Write-Host "  Host: localhost" 
    Write-Host "  Port: 55432"
    Write-Host "  DB: dbaqyldy"
    Write-Host "  User: aqsa"
    Write-Host "  Pass: aqyldysebet123"
    exit 0
} else {
    Write-Host "ERROR: PostgreSQL не запустился" -ForegroundColor Red
    exit 1
}
