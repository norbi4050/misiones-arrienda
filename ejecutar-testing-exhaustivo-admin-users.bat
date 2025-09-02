@echo off
echo ========================================================
echo 🔥 TESTING EXHAUSTIVO - SISTEMA ELIMINACION USUARIOS ADMIN
echo ========================================================
echo.
echo Iniciando testing completo del sistema de eliminacion de usuarios...
echo.

REM Ejecutar el testing exhaustivo
node test-admin-user-management-exhaustivo.js

echo.
echo ========================================================
echo Testing completado. Revisar reporte generado.
echo ========================================================
pause
