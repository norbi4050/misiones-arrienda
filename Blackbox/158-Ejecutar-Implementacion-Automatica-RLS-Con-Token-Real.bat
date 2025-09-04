@echo off
echo ============================================================================
echo 🔒 EJECUTANDO IMPLEMENTACIÓN AUTOMÁTICA DE POLÍTICAS RLS - SUPABASE
echo ============================================================================
echo.
echo Proyecto: Misiones Arrienda
echo Token: sbp_v0_bd3d6b404a4d08b373baf18cf5ce30b841662f39
echo URL: https://qfeyhaaxyemmnohqdele.supabase.co
echo.
echo ⚠️  ADVERTENCIA: Este script implementará políticas RLS críticas
echo    en la base de datos de Supabase usando credenciales reales.
echo.
echo 📋 Acciones que se realizarán:
echo    1. Habilitar RLS en 13 tablas críticas
echo    2. Crear 40+ políticas de seguridad
echo    3. Configurar buckets de storage seguros
echo    4. Implementar funciones de utilidad
echo    5. Verificar implementación completa
echo.
echo ============================================================================

pause

echo.
echo 🚀 Iniciando implementación automática...
echo.

cd /d "%~dp0"

echo 📦 Verificando dependencias de Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en el PATH
    echo.
    echo 💡 Solución:
    echo    1. Instalar Node.js desde https://nodejs.org/
    echo    2. Reiniciar la terminal
    echo    3. Ejecutar este script nuevamente
    echo.
    pause
    exit /b 1
)

echo 📦 Verificando @supabase/supabase-js...
npm list @supabase/supabase-js >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudo instalar @supabase/supabase-js
        pause
        exit /b 1
    )
)

echo.
echo 🔒 Ejecutando implementación de políticas RLS...
echo.

node "157-Script-Implementacion-Automatica-RLS-Con-Token-Real.js"

set SCRIPT_EXIT_CODE=%errorlevel%

echo.
echo ============================================================================

if %SCRIPT_EXIT_CODE% equ 0 (
    echo ✅ IMPLEMENTACIÓN RLS COMPLETADA EXITOSAMENTE
    echo.
    echo 📊 Resultados:
    echo    • Políticas RLS implementadas
    echo    • Buckets de storage configurados
    echo    • Funciones de utilidad creadas
    echo    • Verificación de seguridad completada
    echo.
    echo 📄 Reporte generado: reporte-implementacion-rls-automatica.json
    echo.
    echo 🔄 Próximos pasos recomendados:
    echo    1. Revisar el reporte generado
    echo    2. Ejecutar testing de políticas RLS
    echo    3. Verificar accesos no autorizados
    echo    4. Monitorear logs de auditoría
    echo.
) else (
    echo ❌ IMPLEMENTACIÓN RLS COMPLETADA CON ERRORES
    echo.
    echo 🔍 Posibles causas:
    echo    • Token de Supabase inválido o expirado
    echo    • Permisos insuficientes en la base de datos
    echo    • Problemas de conectividad de red
    echo    • Tablas no existentes en el esquema
    echo.
    echo 💡 Soluciones recomendadas:
    echo    1. Verificar token de Supabase
    echo    2. Revisar permisos de administrador
    echo    3. Comprobar conectividad a internet
    echo    4. Consultar el reporte de errores generado
    echo.
)

echo ============================================================================
echo.

if exist "reporte-implementacion-rls-automatica.json" (
    echo 📄 Abriendo reporte de implementación...
    start notepad "reporte-implementacion-rls-automatica.json"
)

echo.
echo 🔄 ¿Desea ejecutar el testing de políticas RLS ahora? (S/N)
set /p EJECUTAR_TESTING="> "

if /i "%EJECUTAR_TESTING%"=="S" (
    echo.
    echo 🧪 Ejecutando testing de políticas RLS...
    if exist "154-Script-Testing-Politicas-RLS-Post-Implementacion.js" (
        node "154-Script-Testing-Politicas-RLS-Post-Implementacion.js"
    ) else (
        echo ⚠️  Script de testing no encontrado
        echo    Archivo esperado: 154-Script-Testing-Politicas-RLS-Post-Implementacion.js
    )
)

echo.
echo 📋 Implementación automática de RLS finalizada.
echo    Revise los reportes generados para más detalles.
echo.
pause
