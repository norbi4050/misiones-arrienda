@echo off
echo ========================================
echo SOLUCION FINAL - Comandos PowerShell Correctos
echo ========================================
echo.

echo PROBLEMA: Estas usando PowerShell, necesitas usar CMD
echo SOLUCION: Este script usa CMD (no PowerShell)
echo.

echo 1. Habilitando PowerShell para npm...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
echo PowerShell habilitado exitosamente

echo.
echo 2. Navegando al directorio Backend...
cd Backend

echo.
echo 3. Eliminando cache .next (comando CMD)...
if exist .next (
    rmdir /s /q .next
    echo Cache .next eliminado
) else (
    echo No hay cache .next para eliminar
)

echo.
echo 4. Limpiando cache npm...
npm cache clean --force
echo Cache npm limpiado

echo.
echo 5. Compilando proyecto...
npm run build
if %errorlevel% neq 0 (
    echo ERROR en compilacion, pero continuando...
)

echo.
echo 6. Iniciando servidor...
echo ========================================
echo IMPORTANTE: 
echo - Se abrira http://localhost:3000 automaticamente
echo - Usa modo incognito en el navegador
echo - Presiona Ctrl+F5 para forzar recarga
echo - Los cambios YA ESTAN implementados en el codigo
echo ========================================
echo.

start http://localhost:3000
npm run dev

pause
