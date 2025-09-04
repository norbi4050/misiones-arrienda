@echo off
echo ========================================
echo 🧪 TESTING POLITICAS RLS POST-IMPLEMENTACION
echo ========================================
echo.
echo Proyecto: Misiones Arrienda
echo Fecha: %date% %time%
echo.
echo 🔍 Este script verifica que las politicas RLS
echo    se implementaron correctamente y que la
echo    seguridad esta funcionando como esperado.
echo.
echo TESTS INCLUIDOS:
echo ✅ Verificacion RLS habilitado en tablas
echo 🚨 Testing acceso no autorizado (debe fallar)
echo 📋 Verificacion politicas implementadas
echo ✅ Testing casos de uso validos
echo 📁 Testing Storage policies
echo 🔧 Verificacion funciones utilidad
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
    echo    Continuando con testing...
)

echo.
echo 🚀 Ejecutando testing completo de politicas RLS...
echo.
echo ⚠️  IMPORTANTE:
echo    - Este testing verifica la seguridad implementada
echo    - Algunos tests DEBEN fallar (acceso no autorizado)
echo    - Un test exitoso significa seguridad funcionando
echo.

node "154-Script-Testing-Politicas-RLS-Post-Implementacion.js"

if errorlevel 1 (
    echo.
    echo ❌ ERROR EN TESTING RLS
    echo.
    echo 🔧 Posibles causas:
    echo    1. Politicas RLS no implementadas correctamente
    echo    2. Credenciales Supabase incorrectas
    echo    3. Problemas de conectividad
    echo    4. Tablas no encontradas en base de datos
    echo.
    echo 💡 Soluciones:
    echo    1. Ejecutar primero el script de implementacion RLS
    echo    2. Verificar credenciales en archivo .env
    echo    3. Comprobar conexion a Supabase
    echo    4. Revisar logs de error detallados
    echo.
) else (
    echo.
    echo ✅ TESTING RLS COMPLETADO
    echo.
    echo 📊 Resultados guardados en:
    echo    - reporte-testing-rls-post-implementacion.json
    echo.
    echo 🎯 INTERPRETACION DE RESULTADOS:
    echo    ✅ Tests exitosos = Seguridad funcionando
    echo    🚨 Tests criticos = Problemas de seguridad
    echo    ⚠️  Tests con errores = Revisar configuracion
    echo.
    echo 📋 PROXIMOS PASOS SEGUN RESULTADOS:
    echo    - Si hay tests criticos: Corregir inmediatamente
    echo    - Si hay errores: Revisar configuracion
    echo    - Si todo exitoso: Implementar monitoreo continuo
    echo.
)

echo.
echo 📈 METRICAS DE SEGURIDAD EVALUADAS:
echo    🔒 RLS habilitado en tablas criticas
echo    🛡️  Politicas de acceso implementadas
echo    🚫 Bloqueo de acceso no autorizado
echo    ✅ Acceso valido a datos publicos
echo    📁 Seguridad de Storage configurada
echo    🔧 Funciones de utilidad operativas
echo.

echo 💡 RECOMENDACIONES GENERALES:
echo    1. Ejecutar este testing periodicamente
echo    2. Monitorear logs de seguridad
echo    3. Revisar politicas segun casos de uso
echo    4. Mantener credenciales seguras
echo    5. Auditorias de seguridad regulares
echo.

echo ========================================
echo 🧪 TESTING RLS COMPLETADO
echo ========================================
echo.
echo 📅 Proximo testing recomendado:
echo    - Despues de cambios en esquema DB
echo    - Antes de deployment a produccion
echo    - Mensualmente como auditoria
echo.
echo Presione cualquier tecla para continuar...
pause >nul
