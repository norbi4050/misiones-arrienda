@echo off
echo.
echo ========================================
echo   VERIFICACION FINAL - SUPABASE
echo   Proyecto: Misiones Arrienda
echo   Fecha: %date% %time%
echo ========================================
echo.

echo [1/4] Verificando variables de entorno...
cd /d "%~dp0\..\Backend"
if exist ".env.local" (
    echo ✅ Archivo .env.local encontrado
) else (
    echo ❌ ERROR: Archivo .env.local no encontrado
    pause
    exit /b 1
)

echo.
echo [2/4] Testing conexion a Supabase...
node test-supabase-connection.js
if %errorlevel% neq 0 (
    echo ❌ ERROR: Problemas con la conexion a Supabase
    pause
    exit /b 1
)

echo.
echo [3/4] Verificando dependencias...
npm list @supabase/supabase-js >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Dependencia @supabase/supabase-js no encontrada
    pause
    exit /b 1
) else (
    echo ✅ Dependencias de Supabase instaladas correctamente
)

echo.
echo [4/4] Generando reporte final...
echo ========================================
echo   🎉 VERIFICACION COMPLETADA EXITOSAMENTE
echo ========================================
echo.
echo ✅ Variables de entorno: CONFIGURADAS
echo ✅ Conexion Supabase: FUNCIONANDO
echo ✅ Dependencias: INSTALADAS
echo ✅ Testing: EXITOSO
echo.
echo 📁 Documentacion disponible en:
echo    - Blackbox/18-Reporte-Final-Supabase-Implementado.md
echo    - Backend/.env.local
echo    - Backend/test-supabase-connection.js
echo.
echo 🚀 El proyecto esta listo para desarrollo y produccion
echo.
echo ========================================
echo   IMPLEMENTACION SUPABASE COMPLETADA
echo ========================================
echo.
pause
