@echo off
echo ========================================
echo EJECUTANDO AUDITORIA COMPLETA SUPABASE
echo ========================================
echo.
echo Verificando que todo el proyecto coincida con Supabase...
echo Usando credenciales reales para conexion directa
echo.

cd /d "%~dp0"
cd ..

echo Instalando dependencias necesarias...
call npm install @supabase/supabase-js --save-dev

echo.
echo Ejecutando auditoria completa...
node "Blackbox/201-Auditoria-Completa-Proyecto-Vs-Supabase-Con-Credenciales-Reales.js"

echo.
echo ========================================
echo AUDITORIA COMPLETADA
echo ========================================
echo.
echo Revisa el archivo de reporte generado:
echo Blackbox/202-Reporte-Auditoria-Supabase-Completa-Final.json
echo.
pause
