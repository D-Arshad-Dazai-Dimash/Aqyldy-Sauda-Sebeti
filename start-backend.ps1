# Запуск Spring Boot backend
Write-Host "=== Запуск Backend (Spring Boot) ===" -ForegroundColor Cyan

# Проверка Java
Write-Host "Проверяю Java 17..." -ForegroundColor White
& "$PSScriptRoot\check-java.ps1"
if ($LASTEXITCODE -ne 0) {
    exit 1
}

Write-Host ""
Write-Host "Переходу в Backend/project..." -ForegroundColor White
Set-Location "$PSScriptRoot\Backend\project"

# Устанавливаю переменные окружения
Write-Host "Устанавливаю переменные окружения..." -ForegroundColor White
$env:DB_URL = "jdbc:postgresql://localhost:55432/dbaqyldy"
$env:DB_USER = "aqsa"
$env:DB_PASS = "aqyldysebet123"
$env:JWT_SECRET = "dev-secret-at-least-32-chars-long!!"

Write-Host "Запускаю backend..." -ForegroundColor White
Write-Host "Backend будет доступен на http://localhost:8080" -ForegroundColor Cyan
Write-Host "Нажмите Ctrl+C для остановки" -ForegroundColor Yellow
Write-Host ""

.\gradlew.bat bootRun
