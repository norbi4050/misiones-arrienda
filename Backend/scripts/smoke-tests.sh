#!/usr/bin/env bash

# Smoke Tests para Endpoints Críticos - Misiones Arrienda
# Testing crítico reforzado - Enero 2025

set -e

echo "=== SMOKE TESTS - ENDPOINTS CRÍTICOS ==="
echo "Fecha: $(date)"
echo "Objetivo: Validar endpoints críticos identificados en análisis"
echo ""

# Configuración
BASE_URL="${1:-http://localhost:3000}"
LOG_FILE="docs/evidencias/smoke-results.txt"
pass=true

# Función para logging
log_result() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Función para testing con validación de códigos HTTP
run_test() {
    local url="$1"
    local expected_codes="$2"
    local description="$3"
    
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    log_result "Testing: $description"
    log_result "URL: $url"
    log_result "Status: $code"
    
    if [[ "$expected_codes" =~ $code ]]; then
        log_result "✅ PASS - $description"
    else
        log_result "❌ FAIL - $description (expected: $expected_codes, got: $code)"
        pass=false
    fi
    log_result ""
}

# Limpiar log anterior
> "$LOG_FILE"

log_result "=== SMOKE TESTS INICIADOS ==="
log_result "Timestamp: $(date)"
log_result "Base URL: $BASE_URL"
log_result ""

# 1. Verificar que el servidor esté corriendo
log_result "=== VERIFICANDO SERVIDOR ==="
if curl -s --connect-timeout 5 "$BASE_URL" > /dev/null; then
    log_result "✅ SERVIDOR: Respondiendo en $BASE_URL"
else
    log_result "❌ SERVIDOR: No responde en $BASE_URL"
    log_result "NOTA: Ejecutar 'npm run dev' en otra terminal"
    exit 1
fi
log_result ""

# 2. Tests de páginas principales
log_result "=== TESTS DE PÁGINAS PRINCIPALES ==="
run_test "$BASE_URL/" "200" "Página principal"
run_test "$BASE_URL/properties" "200" "Listado de propiedades"
run_test "$BASE_URL/publicar" "200" "Publicar propiedad"
run_test "$BASE_URL/register" "200" "Registro de usuario"
run_test "$BASE_URL/login" "200" "Login de usuario"
run_test "$BASE_URL/profile/inquilino" "200" "Perfil inquilino"
run_test "$BASE_URL/comunidad" "200" "Comunidad"
run_test "$BASE_URL/roommates" "200" "Roommates"
run_test "$BASE_URL/favorites" "200" "Favoritos"
run_test "$BASE_URL/messages" "200" "Mensajes"

# 3. Tests de páginas de ciudades
log_result "=== TESTS DE PÁGINAS DE CIUDADES ==="
run_test "$BASE_URL/posadas" "200" "Posadas"
run_test "$BASE_URL/eldorado" "200" "Eldorado"
run_test "$BASE_URL/puerto-iguazu" "200" "Puerto Iguazú"
run_test "$BASE_URL/obera" "200" "Oberá"

# 4. Tests de APIs críticas (GET)
log_result "=== TESTS DE APIs CRÍTICAS (GET) ==="
run_test "$BASE_URL/api/properties" "200" "API Properties"
run_test "$BASE_URL/api/properties?limit=1" "200" "API Properties con límite"
run_test "$BASE_URL/api/comunidad/profiles" "200|401" "API Comunidad Profiles"
run_test "$BASE_URL/api/comunidad/messages" "200|401" "API Comunidad Messages"
run_test "$BASE_URL/api/users/avatar" "400|401" "API Users Avatar (sin parámetros)"
run_test "$BASE_URL/api/users/profile" "200|401" "API Users Profile"
run_test "$BASE_URL/api/roommates" "200" "API Roommates"
run_test "$BASE_URL/api/messages" "200|401" "API Messages"
run_test "$BASE_URL/api/ping" "200" "API Ping"

# 5. Tests de APIs POST (comentados - requieren autenticación y datos)
log_result "=== TESTS DE APIs POST (COMENTADOS - REQUIEREN AUTH) ==="
log_result "# POST /api/properties/create - Requiere autenticación y datos de propiedad"
log_result "# POST /api/users/profile - Requiere autenticación y datos de perfil"
log_result "# POST /api/upload/avatar - Requiere autenticación y archivo"
log_result ""

# 6. Verificar que rutas de desarrollo estén bloqueadas (deben dar 404 o no existir)
log_result "=== VERIFICANDO BLOQUEO DE RUTAS DE DESARROLLO ==="
run_test "$BASE_URL/test-simple" "404" "Ruta de test bloqueada"
run_test "$BASE_URL/page-debug" "404" "Ruta de debug bloqueada"
run_test "$BASE_URL/api/debug-test" "404" "API de debug bloqueada"

# 7. Resumen final
log_result "=== RESUMEN SMOKE TESTS ==="
log_result "Timestamp final: $(date)"

# Contar éxitos y fallos
SUCCESS_COUNT=$(grep -c "✅ PASS" "$LOG_FILE")
ERROR_COUNT=$(grep -c "❌ FAIL" "$LOG_FILE")

log_result "Éxitos: $SUCCESS_COUNT"
log_result "Errores: $ERROR_COUNT"

if [ "$ERROR_COUNT" -eq 0 ]; then
    log_result ""
    log_result "🎉 TODOS LOS SMOKE TESTS PASARON"
    log_result "Los endpoints críticos están operativos"
else
    log_result ""
    log_result "⚠️  ALGUNOS TESTS FALLARON"
    log_result "Revisar errores arriba para correcciones"
fi

log_result ""
log_result "=== FIN SMOKE TESTS ==="

echo ""
echo "Resultados guardados en: $LOG_FILE"
echo "Para ver el log completo: cat $LOG_FILE"

# Salir con código de error si hay fallos
if [ "$pass" = false ]; then
    exit 1
fi
