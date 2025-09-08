@echo off
echo ========================================
echo TEST FIX ERROR 400 PROFILE - 2025
echo ========================================
echo.

cd /d "%~dp0"

echo Ejecutando test de correccion del error 400...
echo.

node test-fix-error-400-profile.js

echo.
echo ========================================
echo Test completado. Verifica los resultados arriba.
echo ========================================
pause
