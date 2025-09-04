@echo off
echo =====================================================
echo 🚀 TESTING EXHAUSTIVO SUPABASE - MISIONES ARRIENDA
echo =====================================================
echo.
echo 🎯 OBJETIVO: Testing completo y configuracion automatica
echo 📊 PROYECTO: qfeyhaaxyemmnohqdele.supabase.co
echo ⏰ INICIO: %date% %time%
echo.
echo =====================================================

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no está instalado
    echo 📥 Instalar desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si @supabase/supabase-js está instalado
echo 🔍 Verificando dependencias...
npm list @supabase/supabase-js >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo ✅ Dependencias verificadas
echo.

REM Ejecutar el testing exhaustivo
echo 🧪 EJECUTANDO TESTING EXHAUSTIVO...
echo =====================================================
node TESTING-EXHAUSTIVO-SUPABASE-COMPLETO-CON-CREDENCIALES.js

REM Verificar el resultado
if errorlevel 1 (
    echo.
    echo =====================================================
    echo ❌ TESTING COMPLETADO CON ERRORES
    echo =====================================================
    echo 🔧 Revisar el reporte para detalles
    echo 📄 Archivo: REPORTE-TESTING-EXHAUSTIVO-SUPABASE-COMPLETO.md
) else (
    echo.
    echo =====================================================
    echo ✅ TESTING COMPLETADO EXITOSAMENTE
    echo =====================================================
    echo 🎉 Supabase configurado correctamente
    echo 📄 Reporte: REPORTE-TESTING-EXHAUSTIVO-SUPABASE-COMPLETO.md
)

echo.
echo =====================================================
echo 📊 PROXIMOS PASOS:
echo =====================================================
echo 1. Revisar el reporte detallado
echo 2. Si hay errores, seguir las instrucciones
echo 3. Re-ejecutar si es necesario
echo =====================================================

pause
