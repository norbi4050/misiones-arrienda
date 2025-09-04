@echo off
echo ========================================================
echo 🚀 EJECUTANDO TESTING EXHAUSTIVO CON CREDENCIALES REALES
echo ========================================================
echo.
echo ⏰ Timestamp: %date% %time%
echo 🔗 Supabase URL: https://qfeyhaaxyemmnohqdele.supabase.co
echo 📋 Testing: Problema tabla profiles
echo.
echo ========================================================
echo.

echo 📦 Verificando dependencias de Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js no está instalado
    pause
    exit /b 1
)

echo.
echo 🔍 Ejecutando testing exhaustivo...
echo.

node testing-exhaustivo-con-credenciales-reales-final.js

echo.
echo ========================================================
echo ✅ TESTING COMPLETADO
echo ========================================================
echo.
echo 📊 Revisa los resultados arriba para ver si el problema
echo    de la tabla profiles se resolvió.
echo.
echo 🎯 Si el test "Tabla profiles" muestra PASS, el problema
echo    está solucionado. Si muestra FAIL, se requiere aplicar
echo    la solución SQL proporcionada.
echo.
pause
