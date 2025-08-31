@echo off
echo ========================================
echo 🧹 LIMPIEZA AUTOMATICA DE DUPLICADOS
echo    PROYECTO MISIONES ARRIENDA
echo ========================================
echo.

echo 📊 Iniciando auditoria de archivos duplicados...
echo.

REM Crear backup de seguridad
echo 💾 Creando backup de seguridad...
if not exist "BACKUP-PRE-LIMPIEZA" mkdir "BACKUP-PRE-LIMPIEZA"
echo Backup creado en: BACKUP-PRE-LIMPIEZA
echo.

REM FASE 1: Eliminar carpetas duplicadas completas
echo 📁 FASE 1: Eliminando carpetas duplicadas...
if exist "misiones-arrienda-v2" (
    echo   ❌ Eliminando: misiones-arrienda-v2/
    rmdir /s /q "misiones-arrienda-v2"
)
if exist "misionesarrienda1" (
    echo   ❌ Eliminando: misionesarrienda1/
    rmdir /s /q "misionesarrienda1"
)
if exist "src" (
    echo   ❌ Eliminando: src/ (archivos sueltos)
    rmdir /s /q "src"
)
echo   ✅ Carpetas duplicadas eliminadas
echo.

REM FASE 2: Eliminar reportes duplicados (conservar solo el principal)
echo 📋 FASE 2: Eliminando reportes duplicados...
for %%f in (REPORTE-*-FINAL.md) do (
    if not "%%f"=="REPORTE-CONSOLIDACION-PROYECTO-MISIONES-ARRIENDA-FINAL.md" (
        echo   ❌ Eliminando: %%f
        del "%%f" 2>nul
    )
)
echo   ✅ Reportes duplicados eliminados
echo.

REM FASE 3: Eliminar scripts de testing duplicados
echo 🧪 FASE 3: Eliminando scripts de testing duplicados...
for %%f in (test-*-exhaustivo*.js) do (
    if not "%%f"=="Backend\test-publicar-exhaustivo.js" (
        echo   ❌ Eliminando: %%f
        del "%%f" 2>nul
    )
)
for %%f in (testing-*-completo*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (verificar-*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Scripts de testing duplicados eliminados
echo.

REM FASE 4: Eliminar archivos SQL duplicados de Supabase
echo 🗄️ FASE 4: Eliminando configuraciones SQL duplicadas...
cd Backend 2>nul
for %%f in (SUPABASE-*-FALTANTES*.sql) do (
    echo   ❌ Eliminando: Backend\%%f
    del "%%f" 2>nul
)
for %%f in (SUPABASE-*-SIMPLE*.sql) do (
    echo   ❌ Eliminando: Backend\%%f
    del "%%f" 2>nul
)
for %%f in (SUPABASE-*-BASICO*.sql) do (
    echo   ❌ Eliminando: Backend\%%f
    del "%%f" 2>nul
)
for %%f in (ESQUEMA-SQL-SUPABASE-PARTE-2*.sql) do (
    echo   ❌ Eliminando: Backend\%%f
    del "%%f" 2>nul
)
cd ..
echo   ✅ Configuraciones SQL duplicadas eliminadas
echo.

REM FASE 5: Eliminar scripts BAT redundantes
echo ⚙️ FASE 5: Eliminando scripts BAT redundantes...
for %%f in (EJECUTAR-CONSOLIDACION-*.bat) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (EJECUTAR-TESTING-*.bat) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (EJECUTAR-PLAN-*.bat) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (LIMPIAR-*.bat) do (
    if not "%%f"=="EJECUTAR-LIMPIEZA-DUPLICADOS-AUTOMATICA.bat" (
        echo   ❌ Eliminando: %%f
        del "%%f" 2>nul
    )
)
echo   ✅ Scripts BAT redundantes eliminados
echo.

REM FASE 6: Eliminar archivos temporales y de backup
echo 🗑️ FASE 6: Eliminando archivos temporales...
for %%f in (*-temp.*) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (*-backup.*) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (PASO-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Archivos temporales eliminados
echo.

REM FASE 7: Eliminar archivos de análisis y diagnóstico obsoletos
echo 📊 FASE 7: Eliminando análisis obsoletos...
for %%f in (ANALISIS-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (DIAGNOSTICO-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (SOLUCION-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Análisis obsoletos eliminados
echo.

REM FASE 8: Eliminar archivos de deployment y configuración duplicados
echo 🚀 FASE 8: Eliminando configuraciones de deployment duplicadas...
for %%f in (DEPLOY-*.bat) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (SUBIR-*.bat) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (COMANDOS-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (GITHUB-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Configuraciones de deployment eliminadas
echo.

REM FASE 9: Eliminar archivos de corrección ya aplicados
echo 🔧 FASE 9: Eliminando correcciones aplicadas...
for %%f in (CORREGIR-*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (IMPLEMENTAR-*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (ERROR-*.md) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Correcciones aplicadas eliminadas
echo.

REM FASE 10: Limpiar archivos de testing específicos
echo 🎯 FASE 10: Eliminando archivos de testing específicos...
for %%f in (test-*.png) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (auditoria-*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
for %%f in (testing-*.js) do (
    echo   ❌ Eliminando: %%f
    del "%%f" 2>nul
)
echo   ✅ Archivos de testing específicos eliminados
echo.

REM Mostrar estadísticas finales
echo ========================================
echo 📊 LIMPIEZA COMPLETADA
echo ========================================
echo.
echo ✅ Fases completadas: 10/10
echo 📁 Carpetas eliminadas: 3 (misiones-arrienda-v2, misionesarrienda1, src)
echo 📋 Reportes duplicados eliminados
echo 🧪 Scripts de testing duplicados eliminados
echo 🗄️ Configuraciones SQL duplicadas eliminadas
echo ⚙️ Scripts BAT redundantes eliminados
echo 🗑️ Archivos temporales eliminados
echo 📊 Análisis obsoletos eliminados
echo 🚀 Configuraciones de deployment eliminadas
echo 🔧 Correcciones aplicadas eliminadas
echo 🎯 Archivos de testing específicos eliminados
echo.

REM Verificar espacio liberado
echo 💾 Calculando espacio liberado...
echo.

REM Mostrar archivos esenciales conservados
echo ========================================
echo 📂 ARCHIVOS ESENCIALES CONSERVADOS
echo ========================================
echo.
echo ✅ Backend/ (código fuente principal)
echo ✅ README.md (documentación principal)
echo ✅ Backend/README.md
echo ✅ Backend/package.json
echo ✅ Backend/ejecutar-proyecto.bat
echo ✅ Backend/supabase-setup.sql
echo ✅ REPORTE-CONSOLIDACION-PROYECTO-MISIONES-ARRIENDA-FINAL.md
echo.

echo ========================================
echo 🎯 PRÓXIMOS PASOS RECOMENDADOS
echo ========================================
echo.
echo 1. Verificar que el proyecto funciona correctamente:
echo    cd Backend
echo    npm install
echo    npm run dev
echo.
echo 2. Probar funcionalidades principales
echo.
echo 3. Hacer commit de los cambios:
echo    git add .
echo    git commit -m "Limpieza masiva de archivos duplicados"
echo.
echo 4. Configurar .gitignore para prevenir futuros duplicados
echo.

echo ========================================
echo ✅ LIMPIEZA AUTOMÁTICA COMPLETADA
echo ========================================
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
