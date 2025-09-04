@echo off
echo ========================================
echo EJECUTANDO DIAGNOSTICO URL CORREGIDA
echo ========================================
echo.
echo Instalando dependencias necesarias...
npm install @supabase/supabase-js
echo.
echo Ejecutando diagnostico con URL corregida...
node diagnostico-error-registro-url-corregida.js
echo.
echo ========================================
echo DIAGNOSTICO COMPLETADO
echo ========================================
pause
