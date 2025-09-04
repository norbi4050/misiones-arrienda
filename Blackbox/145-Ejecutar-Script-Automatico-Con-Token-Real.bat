@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR SCRIPT AUTOMATICO CON TOKEN REAL
echo Fecha: 3 de Enero 2025
echo ========================================

echo.
echo Verificando dependencias...

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado

:: Verificar si @supabase/supabase-js está instalado
cd /d "%~dp0"
if not exist "node_modules\@supabase\supabase-js" (
    echo 📦 Instalando dependencias de Supabase...
    npm install @supabase/supabase-js
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo ✅ Dependencias verificadas

echo.
echo 🚀 Ejecutando script automático con token real...
echo.

:: Ejecutar el script JavaScript
node "144-Script-Automatico-Con-Token-Real-Community-Profiles.js"

echo.
echo ========================================
echo SCRIPT COMPLETADO
echo ========================================
echo.
echo Si hubo errores, revisa los mensajes anteriores.
echo Si fue exitoso, la tabla community_profiles está lista.
echo.
pause
