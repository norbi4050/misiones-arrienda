@echo off
echo ========================================
echo EJECUTANDO DIAGNOSTICO ERROR REGISTRO
echo ========================================
echo.

cd /d "%~dp0"

echo Instalando dependencias necesarias...
cd Backend
call npm install @supabase/supabase-js
cd ..

echo.
echo Ejecutando diagnostico con credenciales reales...
node diagnostico-error-registro-con-credenciales-reales.js

echo.
echo ========================================
echo DIAGNOSTICO COMPLETADO
echo ========================================
pause
