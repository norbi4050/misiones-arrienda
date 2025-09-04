@echo off
echo ========================================
echo EJECUTANDO CORRECCIONES AUTOMATICAS SUPABASE
echo ========================================
echo.
echo Aplicando correcciones basadas en auditoria...
echo Usando credenciales reales para conexion directa
echo.

cd /d "%~dp0"
cd ..

echo Verificando dependencias necesarias...
call npm install @supabase/supabase-js --save-dev

echo.
echo Ejecutando correcciones automaticas...
node "Blackbox/205-Script-Correccion-Automatica-Desalineaciones-Supabase.js"

echo.
echo ========================================
echo CORRECCIONES COMPLETADAS
echo ========================================
echo.
echo Revisa el archivo de reporte generado:
echo Blackbox/206-Reporte-Correcciones-Automaticas-Final.json
echo.
echo PROXIMOS PASOS:
echo 1. Revisar reporte de correcciones
echo 2. Ejecutar nueva auditoria para verificar
echo 3. Probar funcionalidad del proyecto
echo.
pause
