@echo off
echo ========================================
echo EJECUTANDO TESTING EXHAUSTIVO SUPABASE
echo CON CREDENCIALES REALES - ANALISIS COMPLETO
echo ========================================
echo.
echo Fecha: %date% %time%
echo Proyecto: Misiones Arrienda
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Verificando dependencias de Supabase...
if not exist "node_modules\@supabase\supabase-js" (
    echo Instalando dependencias de Supabase...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo INICIANDO ANALISIS COMPLETO DE SUPABASE
echo ========================================
echo.
echo Este analisis incluye:
echo - Conectividad con credenciales reales
echo - Estructura de base de datos
echo - Autenticacion y registro
echo - Politicas RLS
echo - Storage y buckets
echo - Rendimiento
echo - Funciones Edge
echo - Integridad de datos
echo.

echo Ejecutando testing exhaustivo...
node "TESTING-EXHAUSTIVO-SUPABASE-CON-CREDENCIALES-REALES-COMPLETO.js"

if errorlevel 1 (
    echo.
    echo ========================================
    echo ANALISIS COMPLETADO CON ERRORES
    echo ========================================
    echo.
    echo Se encontraron problemas criticos en Supabase.
    echo Revisa el reporte generado para mas detalles.
    echo.
) else (
    echo.
    echo ========================================
    echo ANALISIS COMPLETADO EXITOSAMENTE
    echo ========================================
    echo.
    echo Supabase esta funcionando correctamente.
    echo Revisa el reporte para detalles completos.
    echo.
)

echo Reporte guardado en: REPORTE-ANALISIS-SUPABASE-COMPLETO-FINAL.json
echo.

pause
