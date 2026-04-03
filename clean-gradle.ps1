# Очистка Gradle кэша для обоих проектов
Write-Host "=== Очистка Gradle кэша ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Остаж Gradle daemons..." -ForegroundColor White

# Backend daemon
Write-Host "  Backend..." -ForegroundColor Gray
cd "$PSScriptRoot\Backend\project"
.\gradlew.bat --stop 2>&1 | Out-Null

# Frontend daemon
Write-Host "  Frontend..." -ForegroundColor Gray
cd "$PSScriptRoot\frontend\android"
.\gradlew.bat --stop 2>&1 | Out-Null

Write-Host ""
Write-Host "Очистка build директорий..." -ForegroundColor White

# Backend clean
Write-Host "  Backend..." -ForegroundColor Gray
cd "$PSScriptRoot\Backend\project"
./gradlew.bat clean 2>&1 | Out-Null

# Frontend clean
Write-Host "  Frontend..." -ForegroundColor Gray
cd "$PSScriptRoot\frontend\android"
./gradlew.bat clean 2>&1 | Out-Null

Write-Host ""
Write-Host "✓ Gradle кэш очищен" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь можете запустить:" -ForegroundColor Cyan
Write-Host "  .\start-dev.ps1" -ForegroundColor White
