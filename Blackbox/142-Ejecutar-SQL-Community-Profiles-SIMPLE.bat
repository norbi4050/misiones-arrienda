@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR SQL COMMUNITY PROFILES
echo Fecha: 3 de Enero 2025
echo ========================================

echo.
echo INSTRUCCIONES PARA EJECUTAR EL SQL:
echo.
echo 1. Ve a tu dashboard de Supabase:
echo    https://qfeyhaaxyemmnohqdele.supabase.co
echo.
echo 2. Ve a la seccion "SQL Editor"
echo.
echo 3. Copia y pega el contenido del archivo:
echo    Blackbox/139-Script-SQL-Community-Profiles-CORREGIDO-FINAL.sql
echo.
echo 4. Ejecuta el script haciendo clic en "Run"
echo.
echo El script incluye:
echo - Habilitacion de extension pg_trgm
echo - Creacion de tabla community_profiles
echo - Indices basicos y GIN corregidos
echo - Triggers para updated_at
echo - Politicas RLS de seguridad
echo - Verificaciones de creacion
echo.

echo PRESIONA CUALQUIER TECLA PARA ABRIR EL DASHBOARD DE SUPABASE...
pause >nul

start https://qfeyhaaxyemmnohqdele.supabase.co

echo.
echo Dashboard de Supabase abierto en tu navegador.
echo Sigue las instrucciones anteriores para ejecutar el SQL.
echo.
pause
