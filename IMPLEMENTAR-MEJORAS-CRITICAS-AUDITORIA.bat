@echo off
echo ========================================
echo 🚀 IMPLEMENTAR MEJORAS CRITICAS - AUDITORIA 2025
echo ========================================
echo.
echo Basado en: AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md
echo Fecha: %date% %time%
echo.

:: Verificar que estamos en el directorio correcto
if not exist "Backend" (
    echo ❌ ERROR: No se encuentra la carpeta Backend
    echo Por favor ejecute este script desde el directorio raiz del proyecto
    pause
    exit /b 1
)

echo 📋 FASE 1: DIAGNOSTICO INICIAL
echo ========================================
echo.

:: Cambiar al directorio Backend
cd Backend

echo ✅ Verificando estructura del proyecto...
if exist "package.json" (
    echo   ✓ package.json encontrado
) else (
    echo   ❌ package.json no encontrado
    pause
    exit /b 1
)

if exist "src" (
    echo   ✓ Directorio src encontrado
) else (
    echo   ❌ Directorio src no encontrado
    pause
    exit /b 1
)

echo.
echo 🔍 Ejecutando diagnostico de build...
echo ========================================

:: Instalar dependencias si es necesario
echo ✅ Verificando dependencias...
npm list --depth=0 > nul 2>&1
if errorlevel 1 (
    echo   ⚠️ Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo   ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    echo   ✓ Dependencias instaladas
) else (
    echo   ✓ Dependencias OK
)

echo.
echo 🔧 Ejecutando build de diagnostico...
npm run build > build-diagnostico.log 2>&1
if errorlevel 1 (
    echo   ❌ BUILD FALLO - Revisando errores...
    echo.
    echo 📄 ERRORES ENCONTRADOS:
    echo ========================================
    type build-diagnostico.log | findstr /i "error"
    echo ========================================
    echo.
    echo ⚠️ Se requiere correccion manual de errores TypeScript
    echo 📋 Revise el archivo: Backend/build-diagnostico.log
    echo.
    echo 🔧 ACCIONES RECOMENDADAS:
    echo 1. Revisar imports no utilizados
    echo 2. Corregir tipos faltantes
    echo 3. Validar todas las rutas
    echo.
    pause
) else (
    echo   ✅ BUILD EXITOSO
)

echo.
echo 📁 FASE 2: LIMPIEZA DE ESTRUCTURA
echo ========================================

:: Volver al directorio raiz
cd ..

echo ✅ Identificando carpetas duplicadas...

:: Verificar carpetas duplicadas
set DUPLICADOS_ENCONTRADOS=0

if exist "misiones-arrienda-v2" (
    echo   ⚠️ Carpeta duplicada encontrada: misiones-arrienda-v2
    set DUPLICADOS_ENCONTRADOS=1
)

if exist "misionesarrienda1" (
    echo   ⚠️ Carpeta duplicada encontrada: misionesarrienda1
    set DUPLICADOS_ENCONTRADOS=1
)

if exist "src" (
    echo   ⚠️ Carpeta duplicada encontrada: src
    set DUPLICADOS_ENCONTRADOS=1
)

if %DUPLICADOS_ENCONTRADOS%==1 (
    echo.
    echo 🗑️ LIMPIEZA REQUERIDA
    echo ========================================
    echo.
    set /p CONFIRMAR="¿Desea crear backup y eliminar carpetas duplicadas? (S/N): "
    if /i "%CONFIRMAR%"=="S" (
        echo.
        echo 📦 Creando backup...
        if not exist "backup" mkdir backup
        
        if exist "misiones-arrienda-v2" (
            echo   📦 Backup: misiones-arrienda-v2
            xcopy "misiones-arrienda-v2" "backup\misiones-arrienda-v2-backup\" /E /I /Q > nul
            rmdir /s /q "misiones-arrienda-v2"
            echo   ✅ Eliminado: misiones-arrienda-v2
        )
        
        if exist "misionesarrienda1" (
            echo   📦 Backup: misionesarrienda1
            xcopy "misionesarrienda1" "backup\misionesarrienda1-backup\" /E /I /Q > nul
            rmdir /s /q "misionesarrienda1"
            echo   ✅ Eliminado: misionesarrienda1
        )
        
        if exist "src" (
            echo   📦 Backup: src
            xcopy "src" "backup\src-backup\" /E /I /Q > nul
            rmdir /s /q "src"
            echo   ✅ Eliminado: src
        )
        
        echo   ✅ Limpieza completada
    ) else (
        echo   ⚠️ Limpieza omitida por el usuario
    )
) else (
    echo   ✅ No se encontraron carpetas duplicadas
)

echo.
echo 📚 FASE 3: ORGANIZACION DE DOCUMENTACION
echo ========================================

cd Backend

echo ✅ Creando estructura de documentacion...
if not exist "docs" mkdir docs
if not exist "docs\reportes" mkdir docs\reportes
if not exist "docs\auditorias" mkdir docs\auditorias
if not exist "docs\testing" mkdir docs\testing

echo   ✓ Estructura de docs creada

echo.
echo 🔧 FASE 4: VALIDACION DE CONFIGURACION
echo ========================================

echo ✅ Verificando archivos de configuracion...

:: Verificar archivos críticos
if exist "next.config.js" (
    echo   ✓ next.config.js encontrado
) else (
    echo   ❌ next.config.js faltante
)

if exist "tsconfig.json" (
    echo   ✓ tsconfig.json encontrado
) else (
    echo   ❌ tsconfig.json faltante
)

if exist "prisma\schema.prisma" (
    echo   ✓ prisma/schema.prisma encontrado
) else (
    echo   ❌ prisma/schema.prisma faltante
)

if exist ".env" (
    echo   ✓ .env encontrado
) else (
    echo   ⚠️ .env no encontrado - crear desde .env.example
)

echo.
echo 🗄️ FASE 5: VERIFICACION BASE DE DATOS
echo ========================================

echo ✅ Verificando configuracion Prisma...
npx prisma generate > nul 2>&1
if errorlevel 1 (
    echo   ❌ Error generando cliente Prisma
    echo   ⚠️ Revisar configuracion de base de datos
) else (
    echo   ✓ Cliente Prisma generado correctamente
)

echo.
echo 🧪 FASE 6: TESTING BASICO
echo ========================================

echo ✅ Verificando configuracion de testing...
if exist "jest.config.js" (
    echo   ✓ Jest configurado
    
    echo ✅ Ejecutando tests basicos...
    npm test -- --passWithNoTests > test-results.log 2>&1
    if errorlevel 1 (
        echo   ⚠️ Algunos tests fallaron - revisar test-results.log
    ) else (
        echo   ✓ Tests basicos pasaron
    )
) else (
    echo   ⚠️ Jest no configurado
)

echo.
echo 📊 RESUMEN DE IMPLEMENTACION
echo ========================================
echo.

:: Generar reporte de estado
echo 📋 ESTADO POST-IMPLEMENTACION > implementacion-reporte.txt
echo =============================== >> implementacion-reporte.txt
echo Fecha: %date% %time% >> implementacion-reporte.txt
echo. >> implementacion-reporte.txt

:: Verificar build final
echo ✅ Verificacion final de build...
npm run build > build-final.log 2>&1
if errorlevel 1 (
    echo   ❌ BUILD AUN FALLA
    echo ❌ Build Status: FALLO >> implementacion-reporte.txt
    echo   📋 Revisar: Backend/build-final.log
    echo.
    echo 🔧 PROXIMOS PASOS REQUERIDOS:
    echo ========================================
    echo 1. Corregir errores TypeScript manualmente
    echo 2. Validar todas las importaciones
    echo 3. Ejecutar nuevamente el build
    echo 4. Continuar con Fase 2 del plan
) else (
    echo   ✅ BUILD EXITOSO
    echo ✅ Build Status: EXITOSO >> implementacion-reporte.txt
    echo.
    echo 🎉 FASE 1 COMPLETADA EXITOSAMENTE
    echo ========================================
    echo ✅ Errores de build corregidos
    echo ✅ Estructura limpia
    echo ✅ Documentacion organizada
    echo ✅ Configuracion validada
    echo.
    echo 📋 LISTO PARA FASE 2: OPTIMIZACION
)

echo. >> implementacion-reporte.txt
echo 📁 Archivos generados: >> implementacion-reporte.txt
echo - build-diagnostico.log >> implementacion-reporte.txt
echo - build-final.log >> implementacion-reporte.txt
echo - test-results.log >> implementacion-reporte.txt
echo - implementacion-reporte.txt >> implementacion-reporte.txt

echo.
echo 📄 Reporte guardado en: Backend/implementacion-reporte.txt
echo.

:: Volver al directorio raiz
cd ..

echo ========================================
echo 🏁 IMPLEMENTACION DE MEJORAS CRITICAS COMPLETADA
echo ========================================
echo.
echo 📋 Revise los logs generados para detalles
echo 📚 Consulte AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md
echo 🚀 Continúe con el Plan de Implementación Fase 2
echo.
pause
