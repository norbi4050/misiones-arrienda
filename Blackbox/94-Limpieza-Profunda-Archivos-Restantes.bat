@echo off
echo ========================================
echo BLACKBOX AI - LIMPIEZA PROFUNDA FINAL
echo ========================================
echo.
echo Eliminando TODOS los archivos innecesarios restantes...
echo.

cd /d "%~dp0\.."

echo [FASE 1] Eliminando archivos de testing y reportes restantes...

REM Eliminar todos los archivos que empiecen con patrones específicos
for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^EJECUTAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^TESTING-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^REPORTE-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^AUDITORIA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PLAN-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SOLUCION-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^DIAGNOSTICO-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^ANALISIS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^IMPLEMENTAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^CORREGIR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^LIMPIAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^ELIMINAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SUBIR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^DEPLOY-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^VERIFICAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^APLICAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^CONFIGURAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SINCRONIZAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PROBAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^CONTINUAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^INVESTIGAR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

echo.
echo [FASE 2] Eliminando archivos con extensiones específicas...

for /f "delims=" %%f in ('dir /b /a-d *.sql 2^>nul ^| findstr /i "SUPABASE"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *.sql 2^>nul ^| findstr /i "ESQUEMA"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d test-*.js 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-FINAL.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-COMPLETO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-EXHAUSTIVO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-COMPLETADO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-EXITOSO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-CORREGIDO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-SOLUCIONADO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-IMPLEMENTADO.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

echo.
echo [FASE 3] Eliminando archivos por patrones específicos...

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "FASE-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "PHASE-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "TODO-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "CHECKLIST-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "COMANDOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "INSTRUCCIONES-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "PASOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "ERROR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "PROBLEMA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "MEJORAS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "RESUMEN-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "REVISION-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "PROXIMOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "VARIABLES-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "GITHUB-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "NETLIFY-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "VERCEL-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "DEPLOYMENT-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

echo.
echo [FASE 4] Eliminando archivos específicos restantes...

REM Eliminar archivos específicos que quedaron
if exist "vercel.json" (
    echo Eliminando vercel.json
    del /q "vercel.json" 2>nul
)

REM Eliminar directorios restantes
for %%d in ("reportes" "CONSOLIDADOS" "misiones-arrienda-v2" "misionesarrienda1" "src") do (
    if exist %%d (
        echo Eliminando directorio %%d
        rmdir /s /q %%d 2>nul
    )
)

echo.
echo [FASE 5] Limpieza final de archivos duplicados en Backend...

cd Backend 2>nul
if errorlevel 1 goto :skip_backend

REM Eliminar archivos innecesarios del Backend
for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^REPORTE-"') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^AUDITORIA-"') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^FASE-"') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SUPABASE-"') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d test-*.js 2^>nul') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *.bat 2^>nul ^| findstr /v "ejecutar-proyecto.bat"') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d *-FINAL.* 2^>nul') do (
    echo Eliminando Backend/%%f
    del /q "%%f" 2>nul
)

cd ..

:skip_backend

echo.
echo ========================================
echo LIMPIEZA PROFUNDA COMPLETADA
echo ========================================
echo.
echo Estructura final del proyecto:
echo - Backend/ (codigo fuente)
echo - Blackbox/ (documentos organizados)
echo - .gitignore
echo - README.md
echo.
echo Proyecto completamente limpio y profesional.
echo.
pause
