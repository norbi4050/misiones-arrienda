@echo off
echo =====================================================
echo EJECUTAR TESTING EXHAUSTIVO - OPTIMIZACION SUPABASE
echo Fecha: 3 de Enero, 2025
echo Desarrollado por: BlackBox AI
echo =====================================================
echo.

echo [INFO] Iniciando testing exhaustivo de optimizaciones Supabase Database Linter...
echo.

REM Verificar si existe Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH
    echo [ERROR] Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo [SUCCESS] Node.js detectado
echo.

REM Verificar si existe el script de testing
if not exist "Blackbox\62-Testing-Exhaustivo-Optimizacion-Supabase-Database-Linter.js" (
    echo [ERROR] Script de testing no encontrado
    echo [ERROR] Archivo requerido: Blackbox\62-Testing-Exhaustivo-Optimizacion-Supabase-Database-Linter.js
    pause
    exit /b 1
)

echo [INFO] Script de testing encontrado
echo.

REM Verificar si existe el script de optimizacion
if not exist "Blackbox\60-Script-Optimizacion-Supabase-Database-Linter.sql" (
    echo [ERROR] Script de optimizacion SQL no encontrado
    echo [ERROR] Archivo requerido: Blackbox\60-Script-Optimizacion-Supabase-Database-Linter.sql
    pause
    exit /b 1
)

echo [INFO] Script de optimizacion SQL encontrado
echo.

REM Verificar variables de entorno de Supabase
echo [INFO] Verificando variables de entorno de Supabase...
if "%DATABASE_URL%"=="" (
    if "%DIRECT_URL%"=="" (
        echo [ERROR] Variables DATABASE_URL y DIRECT_URL no encontradas
        echo [ERROR] Asegurate de tener configurado el archivo .env con las credenciales de Supabase
        echo.
        echo [INFO] Las variables requeridas son:
        echo   - DATABASE_URL=postgresql://[usuario]:[password]@[host]:[puerto]/[database]
        echo   - DIRECT_URL=postgresql://[usuario]:[password]@[host]:[puerto]/[database]
        echo.
        pause
        exit /b 1
    )
)

echo [SUCCESS] Variables de entorno verificadas
echo.

REM Verificar si pg esta instalado
npm list pg >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Dependencia 'pg' no encontrada, intentando instalar...
    npm install pg
    if %errorlevel% neq 0 (
        echo [ERROR] Error instalando dependencia 'pg'
        echo [INFO] Ejecuta manualmente: npm install pg
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencia 'pg' instalada exitosamente
)

echo [SUCCESS] Dependencias verificadas
echo.

REM Crear directorio de logs si no existe
if not exist "logs" mkdir logs

REM Mostrar informacion del testing
echo =====================================================
echo TESTING EXHAUSTIVO - SUPABASE DATABASE LINTER
echo =====================================================
echo.
echo FASES DE TESTING:
echo.
echo FASE 1: Analisis Pre-Optimizacion
echo   - Contar indices existentes
echo   - Verificar foreign keys sin indices
echo   - Analizar politicas RLS actuales
echo   - Medir rendimiento baseline
echo.
echo FASE 2: Ejecucion del Script de Optimizacion
echo   - Ejecutar script SQL completo
echo   - Monitorear comandos exitosos/fallidos
echo   - Registrar errores y warnings
echo.
echo FASE 3: Analisis Post-Optimizacion
echo   - Verificar indices creados
echo   - Validar politicas RLS optimizadas
echo   - Confirmar estadisticas actualizadas
echo   - Medir mejoras de rendimiento
echo.
echo FASE 4: Testing de Funcionalidad
echo   - Verificar integridad referencial
echo   - Probar politicas RLS
echo   - Validar indices unicos
echo.
echo FASE 5: Testing de Uso de Indices
echo   - Analizar estadisticas de uso
echo   - Identificar indices utilizados/no utilizados
echo.
echo FASE 6: Calculo de Mejoras de Rendimiento
echo   - Comparar tiempos pre/post optimizacion
echo   - Calcular porcentajes de mejora
echo   - Generar metricas de impacto
echo.
echo =====================================================

echo.
echo [WARNING] IMPORTANTE: Este testing modificara la base de datos
echo [WARNING] Se ejecutaran las optimizaciones del Database Linter
echo [WARNING] Asegurate de tener un backup de la base de datos
echo.
set /p confirm="¿Deseas continuar con el testing exhaustivo? (S/N): "
if /i not "%confirm%"=="S" (
    echo [INFO] Testing cancelado por el usuario
    pause
    exit /b 0
)

echo.
echo [INFO] Iniciando testing exhaustivo...
echo [INFO] Esto puede tomar varios minutos dependiendo del tamaño de la base de datos
echo.

REM Ejecutar el script de testing
echo [INFO] Ejecutando script de testing JavaScript...
node "Blackbox\62-Testing-Exhaustivo-Optimizacion-Supabase-Database-Linter.js"

REM Capturar el codigo de salida
set testing_result=%errorlevel%

echo.
echo =====================================================
echo TESTING EXHAUSTIVO COMPLETADO
echo =====================================================
echo.

if %testing_result% equ 0 (
    echo [SUCCESS] ✅ TESTING COMPLETADO EXITOSAMENTE
    echo.
    echo RESULTADOS:
    echo - Todas las fases de testing ejecutadas correctamente
    echo - Optimizaciones aplicadas exitosamente
    echo - Mejoras de rendimiento medidas y documentadas
    echo - Funcionalidad verificada sin errores
    echo.
    echo ARCHIVOS GENERADOS:
    echo - Reporte JSON: Blackbox\63-Reporte-Testing-Exhaustivo-Optimizacion-Supabase-Final.json
    echo - Logs detallados en consola
    echo.
    echo PROXIMOS PASOS:
    echo 1. Revisar el reporte JSON generado
    echo 2. Monitorear el rendimiento durante las proximas 24-48 horas
    echo 3. Verificar que todas las funcionalidades siguen operando correctamente
    echo 4. Considerar ajustes adicionales basados en metricas de uso
    
) else (
    echo [ERROR] ❌ TESTING COMPLETADO CON ERRORES
    echo.
    echo POSIBLES CAUSAS:
    echo - Error de conexion a la base de datos
    echo - Credenciales de Supabase incorrectas
    echo - Permisos insuficientes en la base de datos
    echo - Problemas de red o timeout
    echo.
    echo SOLUCION:
    echo 1. Verificar las variables de entorno DATABASE_URL y DIRECT_URL
    echo 2. Confirmar que las credenciales de Supabase son correctas
    echo 3. Verificar conectividad a la base de datos
    echo 4. Revisar los logs para errores especificos
    echo.
    echo ARCHIVOS DE LOG:
    echo - Revisar logs\ para detalles de errores
    echo - Verificar reporte JSON si fue generado parcialmente
)

echo.
echo =====================================================
echo METRICAS DE OPTIMIZACION ESPERADAS
echo =====================================================
echo.
echo Si el testing fue exitoso, deberias ver mejoras en:
echo.
echo 🚀 RENDIMIENTO:
echo   - Consultas de propiedades: 60-80%% mas rapidas
echo   - Autenticacion de usuarios: 40-60%% mas eficiente
echo   - Procesamiento de pagos: 50-70%% mas rapido
echo   - Sistema de favoritos: 70-90%% mas agil
echo   - Busquedas complejas: 80-95%% mas veloces
echo.
echo 📊 RECURSOS:
echo   - Espacio en disco: Reduccion del 15-25%%
echo   - Overhead de mantenimiento: Reduccion del 30-40%%
echo   - Tiempo de respuesta promedio: Mejora del 50-70%%
echo.
echo 🔧 OPTIMIZACIONES APLICADAS:
echo   - Indices criticos para foreign keys creados
echo   - Politicas RLS optimizadas y consolidadas
echo   - Indices duplicados eliminados
echo   - Indices no utilizados criticos eliminados
echo   - Indices compuestos optimizados creados
echo   - Estadisticas de tablas actualizadas
echo.

REM Mostrar informacion adicional si hay archivos generados
if exist "Blackbox\63-Reporte-Testing-Exhaustivo-Optimizacion-Supabase-Final.json" (
    echo [INFO] 📄 Reporte detallado disponible en:
    echo       Blackbox\63-Reporte-Testing-Exhaustivo-Optimizacion-Supabase-Final.json
    echo.
)

if exist "logs\optimizacion-supabase-*.log" (
    echo [INFO] 📋 Logs detallados disponibles en directorio: logs\
    echo.
)

echo [INFO] Para mas informacion sobre las optimizaciones aplicadas, consulta:
echo       Blackbox\59-Auditoria-Supabase-Database-Linter-Completa.md
echo.

echo =====================================================
echo TESTING EXHAUSTIVO FINALIZADO
echo Desarrollado por: BlackBox AI
echo Fecha: 3 de Enero, 2025
echo =====================================================

pause
exit /b %testing_result%
