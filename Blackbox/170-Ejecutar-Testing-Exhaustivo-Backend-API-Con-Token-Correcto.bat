@echo off
echo ========================================
echo TESTING EXHAUSTIVO DE BACKEND/API
echo CON TOKEN CORRECTO
echo ========================================
echo.
echo Ejecutando testing exhaustivo del backend...
echo.

cd /d "%~dp0"
node "169-Testing-Exhaustivo-Backend-API-Con-Token-Correcto.js"

echo.
echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo Revisa el reporte generado para ver los resultados detallados.
echo.
pause
