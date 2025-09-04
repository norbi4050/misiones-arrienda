@echo off
echo ========================================
echo BLACKBOX AI - LIMPIEZA FINAL AGRESIVA
echo ========================================
echo.
echo ELIMINANDO TODOS LOS ARCHIVOS INNECESARIOS RESTANTES...
echo.

cd /d "%~dp0\.."

echo [FASE 1] Eliminando TODOS los archivos de la raiz (excepto esenciales)...

REM Crear lista de archivos a mantener
set "KEEP_FILES=.gitignore README.md"

REM Eliminar todos los archivos .bat de la raiz
for %%f in (*.bat) do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar todos los archivos .js de la raiz
for %%f in (*.js) do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar todos los archivos .md de la raiz (excepto README.md)
for %%f in (*.md) do (
    if /i not "%%f"=="README.md" (
        echo Eliminando %%f
        del /q "%%f" 2>nul
    )
)

REM Eliminar todos los archivos .sql de la raiz
for %%f in (*.sql) do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar todos los archivos .json de la raiz
for %%f in (*.json) do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos con patrones específicos
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

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^FASE-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^TODO-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^CHECKLIST-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^COMANDOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^INSTRUCCIONES-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PASOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^ERROR-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PROBLEMA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^MEJORAS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^RESUMEN-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^REVISION-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PROXIMOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^VARIABLES-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^GITHUB-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^NETLIFY-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^VERCEL-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^DEPLOYMENT-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^GUIA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SISTEMA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^LIMPIEZA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PROYECTO-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^SEMANA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^PLATAFORMA-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^DATOS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^ESTADISTICAS-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

for /f "delims=" %%f in ('dir /b /a-d 2^>nul ^| findstr /i "^VERIFICACION-"') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "test-"
for /f "delims=" %%f in ('dir /b /a-d test-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "verificar-"
for /f "delims=" %%f in ('dir /b /a-d verificar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "ejecutar-"
for /f "delims=" %%f in ('dir /b /a-d ejecutar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "activar-"
for /f "delims=" %%f in ('dir /b /a-d activar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "corregir-"
for /f "delims=" %%f in ('dir /b /a-d corregir-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "implementar-"
for /f "delims=" %%f in ('dir /b /a-d implementar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "analisis-"
for /f "delims=" %%f in ('dir /b /a-d analisis-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "auditoria-"
for /f "delims=" %%f in ('dir /b /a-d auditoria-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "migrar-"
for /f "delims=" %%f in ('dir /b /a-d migrar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos que empiecen con "sincronizar-"
for /f "delims=" %%f in ('dir /b /a-d sincronizar-*.* 2^>nul') do (
    echo Eliminando %%f
    del /q "%%f" 2>nul
)

REM Eliminar archivos específicos restantes
if exist "vercel.json" (
    echo Eliminando vercel.json
    del /q "vercel.json" 2>nul
)

if exist "PASO-1-LIMPIEZA-ARCHIVOS-DUPLICADOS-EJECUTADO.md" (
    echo Eliminando PASO-1-LIMPIEZA-ARCHIVOS-DUPLICADOS-EJECUTADO.md
    del /q "PASO-1-LIMPIEZA-ARCHIVOS-DUPLICADOS-EJECUTADO.md" 2>nul
)

if exist "REFACTORIZACION-COMPLETA-INICIANDO.md" (
    echo Eliminando REFACTORIZACION-COMPLETA-INICIANDO.md
    del /q "REFACTORIZACION-COMPLETA-INICIANDO.md" 2>nul
)

if exist "EJECUTAR-MISIONES-ARRIENDA.bat" (
    echo Eliminando EJECUTAR-MISIONES-ARRIENDA.bat
    del /q "EJECUTAR-MISIONES-ARRIENDA.bat" 2>nul
)

if exist "README-FINAL.md" (
    echo Eliminando README-FINAL.md
    del /q "README-FINAL.md" 2>nul
)

echo.
echo [FASE 2] Eliminando directorios completos obsoletos...

REM Eliminar directorios completos
for %%d in ("CONSOLIDADOS" "reportes" "misiones-arrienda-v2" "misionesarrienda1" "src" "BACKUP-LIMPIEZA") do (
    if exist %%d (
        echo Eliminando directorio %%d
        rmdir /s /q %%d 2>nul
    )
)

echo.
echo [FASE 3] Limpieza final de archivos SQL externos...

REM Eliminar archivos SQL en directorio padre
if exist "../supabase-complete-setup.sql" (
    echo Eliminando ../supabase-complete-setup.sql
    del /q "../supabase-complete-setup.sql" 2>nul
)

if exist "../supabase-complete-setup-final.sql" (
    echo Eliminando ../supabase-complete-setup-final.sql
    del /q "../supabase-complete-setup-final.sql" 2>nul
)

echo.
echo ========================================
echo LIMPIEZA FINAL AGRESIVA COMPLETADA
echo ========================================
echo.
echo Estructura final del proyecto:
echo - Backend/ (codigo fuente completo)
echo - Blackbox/ (documentacion organizada)
echo - .git/ (control de versiones)
echo - .gitignore
echo - README.md
echo.
echo PROYECTO COMPLETAMENTE LIMPIO Y PROFESIONAL
echo.
pause
