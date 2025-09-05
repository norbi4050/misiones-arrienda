@echo off
echo =====================================================
echo EJECUTAR TESTING - NUEVOS WARNINGS SUPABASE
echo Performance Advisor - Database Linter
echo =====================================================
echo Fecha: %date% %time%
echo Objetivo: Validar corrección de 5 nuevos warnings
echo - 4x Multiple Permissive Policies (community_profiles)
echo - 1x Duplicate Index (users)
echo =====================================================

:: Configurar variables de entorno
set NODE_ENV=development
set FORCE_COLOR=1

:: Verificar que Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detectado correctamente

:: Verificar que npm está disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: npm no está disponible
    pause
    exit /b 1
)

echo ✅ npm detectado correctamente

:: Instalar dependencias necesarias si no existen
echo.
echo 📦 Verificando dependencias necesarias...

if not exist "node_modules\@supabase\supabase-js" (
    echo 📥 Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ❌ Error al instalar @supabase/supabase-js
        pause
        exit /b 1
    )
)

if not exist "node_modules\dotenv" (
    echo 📥 Instalando dotenv...
    npm install dotenv
    if errorlevel 1 (
        echo ❌ Error al instalar dotenv
        pause
        exit /b 1
    )
)

echo ✅ Dependencias verificadas

:: Verificar variables de entorno
echo.
echo 🔍 Verificando variables de entorno...

if not exist ".env" (
    if not exist ".env.local" (
        echo ⚠️ Advertencia: No se encontró archivo .env o .env.local
        echo Creando archivo .env de ejemplo...
        echo # Variables de entorno para Supabase > .env
        echo NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co >> .env
        echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key >> .env
        echo.
        echo ⚠️ IMPORTANTE: Configura las variables reales en .env antes de continuar
        echo 1. NEXT_PUBLIC_SUPABASE_URL: URL de tu proyecto Supabase
        echo 2. SUPABASE_SERVICE_ROLE_KEY: Service Role Key de Supabase
        echo.
        echo ¿Deseas continuar con valores de ejemplo? (s/n)
        set /p continue="Respuesta: "
        if /i not "%continue%"=="s" (
            echo Configuración cancelada
            pause
            exit /b 1
        )
    )
)

echo ✅ Variables de entorno verificadas

:: Ejecutar el script de testing
echo.
echo 🚀 Iniciando testing exhaustivo de nuevos warnings...
echo =====================================================

node TESTING-NUEVOS-WARNINGS-SUPABASE-PERFORMANCE-ADVISOR-FINAL.js

:: Verificar el resultado del testing
if errorlevel 1 (
    echo.
    echo ❌ El testing falló con errores
    echo Revisa los logs anteriores para más detalles
    echo.
    echo 🔧 POSIBLES SOLUCIONES:
    echo 1. Verificar que las variables de entorno están configuradas correctamente
    echo 2. Verificar que el script SQL se ejecutó en Supabase Dashboard
    echo 3. Verificar conectividad con Supabase
    echo 4. Revisar permisos del Service Role Key
    echo.
) else (
    echo.
    echo ✅ Testing completado exitosamente
    echo.
    echo 📊 RESULTADOS:
    echo - Revisa el archivo REPORTE-TESTING-NUEVOS-WARNINGS-SUPABASE-FINAL.json
    echo - Verifica que los warnings desaparecieron en Performance Advisor
    echo.
    echo 🔍 PRÓXIMOS PASOS:
    echo 1. Ejecutar el script SQL en Supabase Dashboard si no se hizo
    echo 2. Verificar Performance Advisor en Supabase
    echo 3. Monitorear rendimiento de consultas
    echo 4. Usar funciones de utilidad para monitoreo continuo
)

echo.
echo =====================================================
echo Testing de nuevos warnings completado
echo Fecha: %date% %time%
echo =====================================================

:: Mostrar archivos generados
echo.
echo 📁 ARCHIVOS GENERADOS:
if exist "REPORTE-TESTING-NUEVOS-WARNINGS-SUPABASE-FINAL.json" (
    echo ✅ REPORTE-TESTING-NUEVOS-WARNINGS-SUPABASE-FINAL.json
) else (
    echo ❌ REPORTE-TESTING-NUEVOS-WARNINGS-SUPABASE-FINAL.json (no generado)
)

echo.
echo 💡 CONSEJOS:
echo - Ejecuta este testing después de aplicar el script SQL
echo - Monitorea el Performance Advisor regularmente
echo - Usa las funciones de utilidad para detectar futuros problemas
echo - Mantén documentadas las optimizaciones aplicadas

echo.
pause
