@echo off
echo ========================================
echo LIMPIEZA AUTOMATICA DE ARCHIVOS DUPLICADOS
echo ========================================
echo.

echo [1/5] Limpiando archivos vacios...
for /r "C:\Users\Usuario" %%f in (*) do (
    if %%~zf==0 (
        echo Eliminando archivo vacio: %%f
        del "%%f" 2>nul
    )
)

echo.
echo [2/5] Limpiando extensiones VSCode duplicadas...
if exist "C:\Users\Usuario\.blackbox-editor\extensions" (
    echo Eliminando extensiones BlackBox duplicadas...
    rmdir /s /q "C:\Users\Usuario\.blackbox-editor\extensions" 2>nul
)

echo.
echo [3/5] Limpiando cache Puppeteer duplicado...
if exist "C:\Users\Usuario\.cache\puppeteer" (
    echo Eliminando cache Puppeteer duplicado...
    for /d %%d in ("C:\Users\Usuario\.cache\puppeteer\*") do (
        echo Limpiando: %%d
        rmdir /s /q "%%d" 2>nul
    )
)

echo.
echo [4/5] Limpiando backups antiguos del proyecto...
cd /d "C:\Users\Usuario\Desktop\Misiones-Arrienda"
if exist "BACKUP-*" (
    echo Eliminando carpetas BACKUP-*...
    for /d %%d in (BACKUP-*) do rmdir /s /q "%%d" 2>nul
)

if exist "*.backup.*" (
    echo Eliminando archivos *.backup.*...
    del "*.backup.*" /s /q 2>nul
)

echo.
echo [5/5] Limpiando archivos temporales y duplicados...
del /s /q "*.tmp" 2>nul
del /s /q "*-temp.*" 2>nul
del /s /q "*-backup.*" 2>nul

echo.
echo ========================================
echo LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Espacio liberado estimado: 500MB - 2GB
echo.
pause
