# Smoke Tests para Validación Sprint D-UI
# Testing crítico reforzado - Enero 2025

param(
    [string]$Base = "http://localhost:3000"
)

Write-Host "=== SMOKE TESTS SPRINT D-UI - VALIDACION ===" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Gray
Write-Host "Base URL: $Base" -ForegroundColor Gray
Write-Host ""

$BASE_URL = $Base
$LOG_FILE = "docs/evidencias/smoke-results.txt"

function Log-Result {
    param($Message)
    Write-Host $Message
    Add-Content -Path $LOG_FILE -Value $Message
}

if (Test-Path $LOG_FILE) {
    Remove-Item $LOG_FILE
}

Log-Result "=== SMOKE TESTS SPRINT D-UI INICIADOS ==="
Log-Result "Timestamp: $(Get-Date)"
Log-Result "Base URL: $BASE_URL"
Log-Result ""

# 1. Verificar servidor
Log-Result "=== VERIFICANDO SERVIDOR ==="
try {
    $response = Invoke-WebRequest -Uri $BASE_URL -TimeoutSec 5 -UseBasicParsing
    Log-Result "✅ SERVIDOR: Respondiendo en $BASE_URL"
} catch {
    Log-Result "❌ SERVIDOR: No responde en $BASE_URL"
    exit 1
}
Log-Result ""

# 2. Test endpoints de pagos
Log-Result "=== TESTS DE ENDPOINTS DE PAGOS ==="

# Test /dashboard/billing
Log-Result "Testing /dashboard/billing..."
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/dashboard/billing" -UseBasicParsing
    $status = $response.StatusCode
    Log-Result "✅ /dashboard/billing - Status: $status"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401 -or $status -eq 403) {
        Log-Result "✅ /dashboard/billing - Status: $status (auth requerida)"
    } else {
        Log-Result "❌ /dashboard/billing - ERROR $status"
    }
}

# Test POST /api/payments/feature
Log-Result "Testing POST /api/payments/feature..."
try {
    $body = '{"propertyId": "test-property-id"}'
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/payments/feature" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $status = $response.StatusCode
    Log-Result "⚠️  POST /api/payments/feature - Status: $status"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401 -or $status -eq 403) {
        Log-Result "✅ POST /api/payments/feature - Status: $status (auth requerida)"
    } else {
        Log-Result "❌ POST /api/payments/feature - ERROR $status"
    }
}

# Test POST /api/payments/subscription
Log-Result "Testing POST /api/payments/subscription..."
try {
    $body = '{"plan": "AGENCY_BASIC"}'
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/payments/subscription" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    $status = $response.StatusCode
    Log-Result "⚠️  POST /api/payments/subscription - Status: $status"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401 -or $status -eq 403) {
        Log-Result "✅ POST /api/payments/subscription - Status: $status (auth requerida)"
    } else {
        Log-Result "❌ POST /api/payments/subscription - ERROR $status"
    }
}

Log-Result ""

# 3. Test páginas de gestión
Log-Result "=== TESTS DE GESTIÓN DE PROPIEDADES ==="

Log-Result "Testing /mis-propiedades..."
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/mis-propiedades" -UseBasicParsing
    $status = $response.StatusCode
    Log-Result "✅ /mis-propiedades - Status: $status"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401 -or $status -eq 403) {
        Log-Result "✅ /mis-propiedades - Status: $status (auth requerida)"
    } else {
        Log-Result "❌ /mis-propiedades - ERROR $status"
    }
}

Log-Result ""

# 4. Resumen final
Log-Result "=== RESUMEN SMOKE TESTS SPRINT D-UI ==="
Log-Result "Timestamp final: $(Get-Date)"

$logContent = Get-Content $LOG_FILE -Raw
$successCount = ([regex]::Matches($logContent, "✅")).Count
$errorCount = ([regex]::Matches($logContent, "❌")).Count

Log-Result "Éxitos: $successCount"
Log-Result "Errores: $errorCount"

if ($errorCount -eq 0) {
    Log-Result "🎉 TODOS LOS SMOKE TESTS PASARON"
    Write-Host "🎉 TODOS LOS SMOKE TESTS PASARON" -ForegroundColor Green
} else {
    Log-Result "⚠️  ALGUNOS TESTS FALLARON"
    Write-Host "⚠️  ALGUNOS TESTS FALLARON" -ForegroundColor Yellow
}

Log-Result "=== FIN SMOKE TESTS SPRINT D-UI ==="
Write-Host "Resultados guardados en: $LOG_FILE" -ForegroundColor Gray
