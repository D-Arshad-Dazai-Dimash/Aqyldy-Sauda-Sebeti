# Добавить исключения в Windows Defender для проекта
Write-Host "=== Добавление исключений в Windows Defender ===" -ForegroundColor Cyan
Write-Host ""

# Проверка администратора
$isAdmin = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Нужно запустить от имени администратора!" -ForegroundColor Red
    Write-Host "Перезапустите PowerShell от имени администратора." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Запущено от администратора" -ForegroundColor Green
Write-Host ""

# Пути для исключения
$exclusions = @(
    "C:\Users\Acer\AppData\Local\Android\Sdk",
    "C:\Program Files\Java\jdk-17",
    "$PSScriptRoot"
)

Write-Host "Добавляю исключения для:" -ForegroundColor White
foreach ($path in $exclusions) {
    if (Test-Path $path) {
        Write-Host "  ✓ $path" -ForegroundColor Green
        Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
    } else {
        Write-Host "  ⚠ $path (не найдена)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Добавляю процессы в исключения:" -ForegroundColor White

$processes = @(
    "cmake.exe",
    "ninja.exe",
    "clang++.exe",
    "java.exe",
    "gradle.exe"
)

foreach ($proc in $processes) {
    Write-Host "  + $proc" -ForegroundColor Gray
    Add-MpPreference -ExclusionProcess $proc -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✓ Исключения добавлены в Windows Defender" -ForegroundColor Green
Write-Host ""
Write-Host "Теперь можно запустить:" -ForegroundColor Cyan
Write-Host "  npm run android" -ForegroundColor White
