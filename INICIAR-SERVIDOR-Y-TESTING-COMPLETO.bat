@echo off
echo.
echo ========================================
echo 🚀 INICIAR SERVIDOR Y TESTING COMPLETO
echo ========================================
echo 🎯 Misiones Arrienda - Testing Exhaustivo con Servidor
echo.

REM Cambiar al directorio Backend
cd /d "%~dp0Backend"

REM Verificar si existe package.json
if not exist "package.json" (
    echo ❌ Error: No se encuentra package.json en Backend/
    echo 📁 Verifica que estés en el directorio correcto
    pause
    exit /b 1
)

echo ✅ Directorio Backend encontrado
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
    echo.
)

echo 🚀 Iniciando servidor Next.js...
echo.
echo ⚠️  IMPORTANTE: El servidor se iniciará en una nueva ventana
echo ⚠️  NO CIERRES esa ventana durante el testing
echo ⚠️  Espera a que aparezca "Ready - started server on 0.0.0.0:3000"
echo.

REM Iniciar servidor en nueva ventana
start "Servidor Next.js - Misiones Arrienda" cmd /k "npm run dev"

echo 🕐 Esperando 10 segundos para que el servidor inicie...
timeout /t 10 /nobreak >nul

echo.
echo 🔍 Verificando que el servidor esté funcionando...

REM Volver al directorio raíz para ejecutar el testing
cd /d "%~dp0"

REM Ejecutar testing exhaustivo
echo.
echo 📋 Ejecutando testing exhaustivo...
echo.

node TESTING-EXHAUSTIVO-COMPLETO-INICIANDO.js

REM Verificar si se generó el reporte
if exist "REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md" (
    echo.
    echo ✅ Testing completado exitosamente
    echo 📄 Reporte generado: REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md
    echo.
    echo 🔍 ¿Deseas abrir el reporte? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        start "" "REPORTE-TESTING-EXHAUSTIVO-COMPLETO-FINAL.md"
    )
) else (
    echo.
    echo ⚠️ No se pudo generar el reporte
    echo 🔍 Revisa los errores mostrados arriba
)

echo.
echo ========================================
echo 🎊 TESTING EXHAUSTIVO COMPLETADO
echo ========================================
echo.
echo ⚠️  RECUERDA: Puedes cerrar la ventana del servidor cuando termines
echo.
pause
