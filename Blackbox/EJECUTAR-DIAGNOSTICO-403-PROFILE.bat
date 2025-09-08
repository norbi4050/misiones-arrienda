@echo off
echo ========================================
echo DIAGNOSTICO ERROR 403 PROFILE - 2025
echo ========================================
echo.

cd /d "%~dp0"

echo Ejecutando diagnostico de politicas RLS...
echo.

node diagnostico-403-error-profile-rls.js

echo.
echo ========================================
echo Diagnostico completado. Revisa los resultados arriba.
echo ========================================
pause
