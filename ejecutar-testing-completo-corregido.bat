@echo off
echo ========================================
echo 🚀 EJECUTANDO TESTING COMPLETO CORREGIDO
echo ========================================
echo.

echo 📋 PASO 1: Verificando variables de entorno Supabase...
node verificar-variables-supabase-fixed.js
if %errorlevel% neq 0 (
    echo ❌ Error en verificación de variables
    pause
    exit /b 1
)

echo.
echo 📋 PASO 2: Ejecutando testing de integración corregido...
node test-integracion-supabase-autenticacion-fixed.js
if %errorlevel% neq 0 (
    echo ❌ Error en testing de integración
    pause
    exit /b 1
)

echo.
echo ✅ TESTING COMPLETO CORREGIDO FINALIZADO
echo ========================================
echo.
echo 📊 REPORTES GENERADOS:
echo - REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FIXED-FINAL.md
echo.
echo 🎯 PRÓXIMOS PASOS:
echo 1. Revisar los reportes generados
echo 2. Corregir cualquier problema identificado
echo 3. Ejecutar testing adicional si es necesario
echo.
pause
