@echo off
echo =====================================================
echo BLACKBOX AI - EJECUTAR CONFIGURACION SUPABASE
echo Archivo: 107-Ejecutar-Configuracion-Supabase-Con-Credenciales.bat
echo Fecha: %date% %time%
echo =====================================================

cd /d "%~dp0.."

echo.
echo 🚀 INICIANDO CONFIGURACION COMPLETA DE SUPABASE...
echo 📅 Fecha: %date% %time%
echo 🔗 URL Supabase: https://qfeyhaaxyemmnohqdele.supabase.co
echo.

echo 📦 Instalando dependencias necesarias...
cd Backend
call npm install @supabase/supabase-js

echo.
echo 🔧 Ejecutando script de configuración...
node "../Blackbox/106-Script-Configuracion-Supabase-Con-Credenciales-Reales.js"

echo.
echo ✅ Configuración completada!
echo 📊 Revisa el reporte generado: Blackbox/107-Reporte-Configuracion-Supabase-Con-Credenciales-Final.json
echo.

pause
