# SPRINT A - Smoke Tests Windows-ready
# Cross-platform validation for core routes
param(
    [string]$Base = "http://localhost:3000"
)

Write-Host "=== SMOKE TESTS - SPRINT A RECONEXION FLOW ===" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date)" -ForegroundColor Gray
Write-Host "Base URL: $Base" -ForegroundColor Gray
Write-Host "Objetivo: Validar rutas core sin depender de bash en Windows" -ForegroundColor Gray
Write-Host ""

# Configuración
$BASE_URL = $Base
$LOG_FILE = "docs/evidencias/smoke-results.txt"

# Función para logging con formato Result: PASS/FAIL
function Log-Result {
    param($Message, $Status = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    Write-Host $logMessage
    Add-Content -Path $LOG_FILE -Value $logMessage
    
    if ($Status -eq "PASS" -or $Status -eq "FAIL") {
        $resultMessage = "Result: $Status"
        Write-Host $resultMessage
        Add-Content -Path $LOG_FILE -Value $resultMessage
    }
}

# Función para test de ruta
function Test-Route {
    param($Route, $ExpectedStatuses = @(200))
    
    $url = "$BASE_URL$Route"
    Log-Result "Testing $Route..." "INFO"
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
        $status = $response.StatusCode
        
        if ($ExpectedStatuses -contains $status) {
            Log-Result "$Route - Status: $status" "PASS"
            return $true
        } else {
            Log-Result "$Route - Unexpected status: $status" "FAIL"
            return $false
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($null -eq $status) {
            Log-Result "$Route - Connection error: $($_.Exception.Message)" "FAIL"
            return $false
        }
        
        if ($ExpectedStatuses -contains $status) {
            Log-Result "$Route - Status: $status (expected)" "PASS"
            return $true
        } else {
            Log-Result "$Route - Status: $status" "FAIL"
            return $false
        }
    }
}

# Crear directorio de evidencias si no existe
$evidenciasDir = Split-Path -Parent $LOG_FILE
if (!(Test-Path $evidenciasDir)) {
    New-Item -ItemType Directory -Path $evidenciasDir -Force | Out-Null
}

# Limpiar log anterior
if (Test-Path $LOG_FILE) {
    Remove-Item $LOG_FILE
}

Log-Result "=== SMOKE TESTS INICIADOS ===" "INFO"
Log-Result "Base URL: $BASE_URL" "INFO"
Log-Result "Timestamp: $(Get-Date)" "INFO"
Log-Result "" "INFO"

# Verificar que el servidor esté corriendo
Log-Result "=== VERIFICANDO SERVIDOR ===" "INFO"
$serverRunning = Test-Route "/" @(200)
if (-not $serverRunning) {
    Log-Result "❌ SERVIDOR: No responde en $BASE_URL" "FAIL"
    Log-Result "NOTA: Ejecutar 'npm run dev' en otra terminal" "INFO"
    exit 1
}
Log-Result "" "INFO"

# Tests de páginas principales
Log-Result "=== TESTS DE PÁGINAS PRINCIPALES ===" "INFO"
$pageTests = @()
$pageTests += Test-Route "/" @(200)
$pageTests += Test-Route "/properties" @(200)
$pageTests += Test-Route "/publicar" @(200, 401, 403)
$pageTests += Test-Route "/register" @(200)
$pageTests += Test-Route "/login" @(200)
$pageTests += Test-Route "/comunidad" @(200, 401, 403)
$pageTests += Test-Route "/roommates" @(200)
Log-Result "" "INFO"

# Tests de páginas de ciudades (aceptar 200 o 404)
Log-Result "=== TESTS DE PÁGINAS DE CIUDADES ===" "INFO"
$cityTests = @()
$cityTests += Test-Route "/posadas" @(200, 404)
$cityTests += Test-Route "/eldorado" @(200, 404)
$cityTests += Test-Route "/puerto-iguazu" @(200, 404)
$cityTests += Test-Route "/obera" @(200, 404)
Log-Result "" "INFO"

# Tests de APIs críticas
Log-Result "=== TESTS DE APIs CRÍTICAS ===" "INFO"
$apiTests = @()
$apiTests += Test-Route "/api/properties?limit=1" @(200, 401, 403)
$apiTests += Test-Route "/api/comunidad/profiles" @(200, 401, 403)
$apiTests += Test-Route "/api/comunidad/messages" @(200, 401, 403)
$apiTests += Test-Route "/api/users/avatar" @(200, 400, 401, 405)
$apiTests += Test-Route "/api/users/profile" @(200, 401, 403)
$apiTests += Test-Route "/api/roommates" @(200, 401, 403)
$apiTests += Test-Route "/api/ping" @(200, 404)
Log-Result "" "INFO"

# Resumen final
Log-Result "=== RESUMEN SMOKE TESTS ===" "INFO"
Log-Result "Timestamp final: $(Get-Date)" "INFO"

# Contar éxitos y errores
$logContent = Get-Content $LOG_FILE -Raw
$passCount = ([regex]::Matches($logContent, "Result: PASS")).Count
$failCount = ([regex]::Matches($logContent, "Result: FAIL")).Count
$totalTests = $passCount + $failCount

Log-Result "Total tests: $totalTests" "INFO"
Log-Result "Passed: $passCount" "INFO"
Log-Result "Failed: $failCount" "INFO"

if ($failCount -eq 0) {
    Log-Result "" "INFO"
    Log-Result "🎉 TODOS LOS SMOKE TESTS PASARON" "PASS"
    Log-Result "Todas las rutas core están operativas" "INFO"
    Write-Host "🎉 TODOS LOS SMOKE TESTS PASARON" -ForegroundColor Green
    $exitCode = 0
} else {
    Log-Result "" "INFO"
    Log-Result "⚠️  ALGUNOS TESTS FALLARON" "FAIL"
    Log-Result "Revisar errores arriba para correcciones" "INFO"
    Write-Host "⚠️  ALGUNOS TESTS FALLARON" -ForegroundColor Yellow
    $exitCode = 1
}

Log-Result "" "INFO"
Log-Result "=== FIN SMOKE TESTS ===" "INFO"

Write-Host ""
Write-Host "Resultados guardados en: $LOG_FILE" -ForegroundColor Gray
Write-Host "Para ver el log completo: Get-Content $LOG_FILE" -ForegroundColor Gray

exit $exitCode
