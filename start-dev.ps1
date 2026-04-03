# Главный скрипт для запуска всего системы
# Этот скрипт проверяет окружение и выводит инструкции для запуска в разных терминалах

Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Aqyldy Sauda Sebeti - Unified Development Setup         ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Проверка Java 17
Write-Host "[1/5] Проверяю Java 17..." -ForegroundColor Cyan
& "$PSScriptRoot\check-java.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Исправьте выше перечисленные ошибки и попробуйте снова" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Проверка Docker
Write-Host "[2/5] Проверяю Docker..." -ForegroundColor Cyan
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ Warning: Docker не найден в PATH" -ForegroundColor Yellow
    Write-Host "  Установите Docker Desktop для локальной работы с БД" -ForegroundColor Yellow
} else {
    Write-Host "✓ Docker найден" -ForegroundColor Green
}
Write-Host ""

# 3. Проверка Node.js
Write-Host "[3/5] Проверяю Node.js..." -ForegroundColor Cyan
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js не найден в PATH" -ForegroundColor Red
    Write-Host "  Установите Node.js 20+" -ForegroundColor Yellow
    exit 1
} else {
    $nodeVersion = (node --version)
    Write-Host "✓ Node.js найден: $nodeVersion" -ForegroundColor Green
}
Write-Host ""

# 4. Проверка Android tools
Write-Host "[4/5] Проверяю Android SDK..." -ForegroundColor Cyan
if ($env:ANDROID_HOME) {
    Write-Host "✓ ANDROID_HOME установлен: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: ANDROID_HOME не установлен" -ForegroundColor Yellow
    Write-Host "  Может потребоваться для физического тестирования" -ForegroundColor Yellow
}
Write-Host ""

# 5. Готово - выводим инструкции
Write-Host "[5/5] Все компоненты проверены" -ForegroundColor Cyan
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ИНСТРУКЦИИ ЗАПУСКА                          ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "Откройте новые PowerShell терминалы и выполните в таком порядке:" -ForegroundColor White
Write-Host ""

Write-Host "📌 Терминал 1 - Запуск БД:" -ForegroundColor Yellow
Write-Host "   .\start-db.ps1" -ForegroundColor Cyan
Write-Host "   Подождите 3-5 секунд и перейдите к терминалу 2" -ForegroundColor Gray
Write-Host ""

Write-Host "📌 Терминал 2 - Запуск Backend:" -ForegroundColor Yellow
Write-Host "   .\start-backend.ps1" -ForegroundColor Cyan
Write-Host "   Подождите, пока увидите 'Tomcat started'" -ForegroundColor Gray
Write-Host "   Backend будет на http://localhost:8080" -ForegroundColor Gray
Write-Host ""

Write-Host "📌 Терминал 3 - Запуск Metro:" -ForegroundColor Yellow
Write-Host "   .\start-frontend-metro.ps1" -ForegroundColor Cyan
Write-Host "   Metro должен запуститься и ждать команд" -ForegroundColor Gray
Write-Host ""

Write-Host "📌 Терминал 4 - Запуск Android App:" -ForegroundColor Yellow
Write-Host "   .\start-frontend-android.ps1" -ForegroundColor Cyan
Write-Host "   Убедитесь, что эмулятор запущен перед этой командой" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""
Write-Host "Советы:" -ForegroundColor White
Write-Host "  • Используйте разные терминалы для каждого компонента" -ForegroundColor Gray
Write-Host "  • Порядок запуска критичен: DB → Backend → Metro → Android" -ForegroundColor Gray
Write-Host "  • Если ошибка - проверьте Troubleshooting в README.md" -ForegroundColor Gray
Write-Host "  • Нажмите Ctrl+C в любом терминале для остановки компонента" -ForegroundColor Gray
Write-Host ""
