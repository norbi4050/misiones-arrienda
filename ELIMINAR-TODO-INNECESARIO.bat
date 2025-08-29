@echo off
echo ========================================
echo ELIMINANDO TODO LO INNECESARIO...
echo ========================================

REM Eliminar TODOS los archivos .md excepto README.md
for %%f in (*.md) do (
    if not "%%f"=="README.md" (
        echo Eliminando: %%f
        del "%%f" 2>nul
    )
)

REM Eliminar TODOS los archivos .js de testing
del *.js 2>nul

REM Eliminar TODOS los archivos .bat excepto este
for %%f in (*.bat) do (
    if not "%%f"=="ELIMINAR-TODO-INNECESARIO.bat" (
        echo Eliminando: %%f
        del "%%f" 2>nul
    )
)

REM Eliminar TODOS los archivos .sql
del *.sql 2>nul

REM Eliminar archivos de configuracion duplicados
del vercel.json 2>nul
del package.json 2>nul

REM Eliminar directorios COMPLETOS que no sirven
echo Eliminando directorios innecesarios...
rmdir /s /q "src" 2>nul
rmdir /s /q "misiones-arrienda-v2" 2>nul
rmdir /s /q "misionesarrienda1" 2>nul

REM Limpiar archivos HTML innecesarios del Backend
del "Backend\*.html" 2>nul

REM Eliminar archivos .bat innecesarios del Backend
for %%f in (Backend\*.bat) do (
    echo Eliminando Backend: %%f
    del "%%f" 2>nul
)

REM Eliminar archivos .js de testing del Backend
del "Backend\*.js" 2>nul

REM Eliminar archivos .md innecesarios del Backend
for %%f in (Backend\*.md) do (
    if not "%%f"=="Backend\README.md" (
        echo Eliminando Backend: %%f
        del "%%f" 2>nul
    )
)

REM Eliminar archivos .sql del Backend
del "Backend\*.sql" 2>nul

REM Eliminar archivos .txt del Backend
del "Backend\*.txt" 2>nul

REM Eliminar archivos .ps1 del Backend
del "Backend\*.ps1" 2>nul

REM Eliminar archivos .toml del Backend
del "Backend\*.toml" 2>nul

echo ========================================
echo LIMPIEZA COMPLETADA!
echo ========================================
echo.
echo ESTRUCTURA FINAL:
echo - Backend/ (PROYECTO PRINCIPAL)
echo - README.md
echo - ELIMINAR-TODO-INNECESARIO.bat
echo.
echo Para ejecutar: cd Backend ^&^& npm run dev
echo ========================================
pause
