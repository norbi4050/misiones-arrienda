@echo off
echo =====================================================
echo EJECUTAR TESTING SOLUCION SUPABASE DATABASE LINTER
echo Proyecto: Misiones Arrienda
echo =====================================================

echo.
echo [PASO 1] Instalando dependencias necesarias...
echo.

cd Backend
if not exist node_modules (
    echo Instalando dependencias de Node.js...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
)

echo.
echo [PASO 2] Verificando dependencias de Supabase...
echo.

npm list @supabase/supabase-js >nul 2>&1
if errorlevel 1 (
    echo Instalando @supabase/supabase-js...
    npm install @supabase/supabase-js
    if errorlevel 1 (
        echo ❌ Error instalando @supabase/supabase-js
        pause
        exit /b 1
    )
)

cd ..

echo.
echo [PASO 3] Ejecutando testing de la solución...
echo.

node TEST-SOLUCION-SUPABASE-DATABASE-LINTER.js

if errorlevel 1 (
    echo.
    echo ❌ ERROR EN EL TESTING
    echo.
    echo Posibles causas:
    echo 1. Las credenciales de Supabase no son correctas
    echo 2. El script SQL no se ejecutó completamente
    echo 3. Problemas de conectividad
    echo.
    echo SOLUCIONES:
    echo 1. Verificar variables de entorno en .env
    echo 2. Aplicar el script SQL en el panel de Supabase
    echo 3. Verificar conexión a internet
    echo.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo TESTING COMPLETADO EXITOSAMENTE
echo =====================================================
echo.
echo ✅ Se ha generado el reporte:
echo    REPORTE-TESTING-SUPABASE-DATABASE-LINTER-FINAL.md
echo.
echo 📊 Revisa el reporte para ver:
echo    - Políticas RLS optimizadas
echo    - Índices duplicados eliminados
echo    - Funciones auxiliares creadas
echo    - Mejoras de rendimiento
echo    - Problemas solucionados
echo.

if exist "REPORTE-TESTING-SUPABASE-DATABASE-LINTER-FINAL.md" (
    echo 📄 Abriendo reporte...
    start "" "REPORTE-TESTING-SUPABASE-DATABASE-LINTER-FINAL.md"
)

echo.
echo =====================================================
echo PRÓXIMOS PASOS RECOMENDADOS:
echo =====================================================
echo.
echo 1. 📋 Revisar el reporte generado
echo 2. 🔍 Verificar métricas en el panel de Supabase
echo 3. 🚀 Monitorear rendimiento en producción
echo 4. 📈 Implementar métricas de monitoreo continuo
echo.
echo Si encuentras problemas:
echo - Revisa los logs en Supabase Dashboard
echo - Verifica que todas las políticas funcionan
echo - Monitorea el rendimiento de consultas
echo.

pause
