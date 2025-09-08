@echo off
echo ========================================
echo SOLUCION ERROR 403 PROFILE RLS - 2025
echo ========================================
echo.

cd /d "%~dp0"

echo Ejecutando solucion de politicas RLS para error 403...
echo.

echo IMPORTANTE: Ejecutar este script en Supabase SQL Editor
echo Archivo: solucion-403-error-profile-rls.sql
echo.
echo Instrucciones:
echo 1. Abrir Supabase Dashboard
echo 2. Ir a SQL Editor
echo 3. Copiar y pegar el contenido de solucion-403-error-profile-rls.sql
echo 4. Ejecutar el script
echo.

echo Presiona cualquier tecla para continuar con la verificacion...
pause > nul

echo.
echo Ejecutando verificacion de politicas RLS...
echo.

node diagnostico-403-error-profile-rls.js

echo.
echo ========================================
echo Verificacion completada. Si las politicas se aplicaron correctamente,
echo el error 403 deberia estar resuelto.
echo ========================================
pause
