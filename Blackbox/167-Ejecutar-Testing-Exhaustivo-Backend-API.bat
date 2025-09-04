@echo off
echo ========================================
echo EJECUTANDO TESTING EXHAUSTIVO BACKEND/API
echo ========================================
echo.
echo Este script ejecuta un testing exhaustivo completo del backend y APIs
echo verificando endpoints, autenticacion, seguridad y rendimiento.
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

cd /d "%~dp0"
node "166-Testing-Exhaustivo-Backend-API-Completo.js"

echo.
echo ========================================
echo TESTING EXHAUSTIVO COMPLETADO
echo ========================================
echo.
echo Revisa el archivo de reporte generado para ver los resultados detallados.
echo.
pause
