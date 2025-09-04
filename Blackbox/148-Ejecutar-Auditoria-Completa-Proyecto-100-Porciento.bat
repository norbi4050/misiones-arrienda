o@echo off
echo ========================================
echo BLACKBOX AI - EJECUTAR AUDITORIA COMPLETA PROYECTO 100%
echo Fecha: 3 de Enero 2025
echo ========================================

echo.
echo 🔍 Iniciando auditoría completa del proyecto...
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado

:: Cambiar al directorio del script
cd /d "%~dp0"

:: Verificar si @supabase/supabase-js está instalado
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
echo 🚀 Ejecutando auditoría completa con token real...
echo    - Verificando conexión a Supabase
echo    - Auditando tablas y esquemas
echo    - Verificando políticas RLS
echo    - Revisando Storage Buckets
echo    - Validando código local
echo    - Generando reporte completo
echo.

:: Ejecutar el script de auditoría
node "147-Auditoria-Completa-Proyecto-100-Porciento-Con-Token-Real.js"

echo.
echo ========================================
echo AUDITORIA COMPLETADA
echo ========================================
echo.

:: Verificar si se generó el archivo de resultados
if exist "148-Resultados-Auditoria-Completa.json" (
    echo ✅ Resultados guardados en: 148-Resultados-Auditoria-Completa.json
) else (
    echo ⚠️  No se pudo generar el archivo de resultados
)

echo.
echo 📋 PRÓXIMOS PASOS:
echo    1. Revisar el reporte de auditoría mostrado arriba
echo    2. Implementar las correcciones recomendadas
echo    3. Ejecutar script de corrección automática si es necesario
echo    4. Volver a ejecutar auditoría para verificar mejoras
echo.
pause
