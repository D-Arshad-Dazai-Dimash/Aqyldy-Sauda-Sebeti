# ai_smoke.ps1 — quick end-to-end smoke test for the AI chatbot.
#
# Logs a known buyer in against the Spring Boot backend, then POSTs a
# message to the AI service /api/ai/chat endpoint and asserts that we
# get a non-empty reply back. Useful for verifying that:
#   - JWT_SECRET is shared between Spring Boot and the AI service
#   - GEMINI_API_KEY is set on the AI service
#   - CORS / routing is wired correctly on DigitalOcean
#
# Usage:
#   ./ai_smoke.ps1 -ApiUrl https://aqyldy-sauda-sebeti-iw5jq.ondigitalocean.app `
#                  -AiUrl  https://aqyldy-ai-service-iw5jq.ondigitalocean.app `
#                  -Email  buyer@aqyldy.kz -Password Buyer123!

[CmdletBinding()]
param(
    [string]$ApiUrl = $env:APP_API_URL,
    [string]$AiUrl  = $env:APP_AI_URL,
    [string]$Email  = $env:APP_TEST_EMAIL,
    [string]$Password = $env:APP_TEST_PASSWORD,
    [string]$Message = "Сәлем! Маған сүт пен нан керек. Қайдан табамын?"
)

if (-not $ApiUrl)   { throw "ApiUrl is required (or APP_API_URL env)." }
if (-not $AiUrl)    { throw "AiUrl is required (or APP_AI_URL env)." }
if (-not $Email)    { throw "Email is required (or APP_TEST_EMAIL env)." }
if (-not $Password) { throw "Password is required (or APP_TEST_PASSWORD env)." }

$ErrorActionPreference = 'Stop'
$ApiUrl = $ApiUrl.TrimEnd('/')
$AiUrl  = $AiUrl.TrimEnd('/')

Write-Host "▶ Step 1: AI health check ($AiUrl/api/ai/health)" -ForegroundColor Cyan
$health = Invoke-RestMethod -Method Get -Uri "$AiUrl/api/ai/health"
$health | Format-List

if (-not $health.gemini_ready) {
    Write-Warning "gemini_ready=false — chatbot will use rule-based fallback. Set GEMINI_API_KEY on the AI service."
}

Write-Host "▶ Step 2: Login against Spring Boot ($ApiUrl/api/auth/login)" -ForegroundColor Cyan
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri "$ApiUrl/api/auth/login" `
    -ContentType 'application/json' -Body $loginBody
$token = $login.accessToken
if (-not $token) {
    throw "Login did not return an accessToken. Response: $($login | ConvertTo-Json -Compress)"
}
Write-Host "  ✓ got JWT (length=$($token.Length))" -ForegroundColor Green

Write-Host "▶ Step 3: POST $AiUrl/api/ai/chat" -ForegroundColor Cyan
$chatBody = @{ message = $Message } | ConvertTo-Json -Compress
try {
    $chat = Invoke-RestMethod -Method Post -Uri "$AiUrl/api/ai/chat" `
        -Headers @{ Authorization = "Bearer $token" } `
        -ContentType 'application/json' -Body $chatBody
} catch {
    Write-Error "Chat request failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Error $reader.ReadToEnd()
    }
    exit 1
}

$reply = $chat.reply ?? $chat.message ?? ($chat | ConvertTo-Json -Compress)
Write-Host "  reply: $reply" -ForegroundColor Yellow

if (-not $reply -or $reply.Trim().Length -eq 0) {
    throw "Chat reply was empty — chatbot is broken."
}

Write-Host "✓ AI smoke test passed." -ForegroundColor Green
