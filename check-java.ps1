# Проверка Java 17
Write-Host "=== Проверка Java 17 ===" -ForegroundColor Cyan

$javaVersion = java -version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Java не найден в PATH" -ForegroundColor Red
    Write-Host "Установите JDK 17 и добавьте в PATH, или выставьте JAVA_HOME" -ForegroundColor Yellow
    exit 1
}

$versionString = $javaVersion[0]
if ($versionString -match '17\.') {
    Write-Host "✓ Java 17 найдена" -ForegroundColor Green
    Write-Host $versionString
    exit 0
} else {
    Write-Host "ERROR: Требуется Java 17" -ForegroundColor Red
    Write-Host $javaVersion
    Write-Host ""
    Write-Host "Выставьте JAVA_HOME на JDK 17:" -ForegroundColor Yellow
    Write-Host "setx JAVA_HOME `"C:\Program Files\Java\jdk-17`"" -ForegroundColor White
    exit 1
}
