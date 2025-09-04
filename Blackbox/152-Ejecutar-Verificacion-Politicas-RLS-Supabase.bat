@echo off
echo ========================================
echo 🔒 EJECUTANDO VERIFICACION RLS SUPABASE
echo ========================================
echo.
echo Proyecto: Misiones Arrienda
echo Fecha: %date% %time%
echo.
echo ⚠️  PROBLEMA CRITICO DETECTADO:
echo    - Tablas sin politicas RLS
echo    - Datos sensibles expuestos
echo    - Riesgo de seguridad ALTO
echo.
echo 🔍 Iniciando verificacion...
echo.

cd /d "%~dp0"

echo 📦 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js no encontrado
    echo    Instale Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo 📦 Instalando dependencias necesarias...
npm install @supabase/supabase-js >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Advertencia: Error instalando dependencias
    echo    Continuando con verificacion...
)

echo.
echo 🚀 Ejecutando script de verificacion RLS...
echo.

node "151-Script-Verificacion-Politicas-RLS-Supabase-Critico.js"

if errorlevel 1 (
    echo.
    echo ❌ ERROR EN VERIFICACION RLS
    echo.
    echo 🔧 Posibles soluciones:
    echo    1. Verificar credenciales Supabase
    echo    2. Comprobar conexion a internet
    echo    3. Revisar permisos de base de datos
    echo.
) else (
    echo.
    echo ✅ VERIFICACION RLS COMPLETADA
    echo.
    echo 📊 Resultados guardados en:
    echo    - reporte-rls-verificacion.json
    echo.
    echo 🚨 ACCION REQUERIDA:
    echo    Si se detectaron tablas sin RLS,
    echo    ejecute inmediatamente el script
    echo    de implementacion de politicas.
    echo.
)

echo.
echo 📋 PROXIMOS PASOS:
echo    1. Revisar reporte generado
echo    2. Implementar politicas RLS faltantes
echo    3. Testing de seguridad
echo    4. Verificacion post-implementacion
echo.

echo ========================================
echo 🔒 VERIFICACION RLS COMPLETADA
echo ========================================
echo.
echo Presione cualquier tecla para continuar...
pause >nul
