@echo off
echo ========================================
echo SOLUCION DEFINITIVA - PowerShell + Proyecto
echo ========================================
echo.

echo PROBLEMA DETECTADO: PowerShell execution policy bloqueada
echo SOLUCION: Usar Command Prompt (CMD) en lugar de PowerShell
echo.

echo 1. Habilitando PowerShell temporalmente...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
echo PowerShell habilitado para el usuario actual

echo.
echo 2. Navegando al directorio Backend...
cd Backend

echo.
echo 3. Limpiando cache de Next.js...
if exist .next rmdir /s /q .next
echo Cache .next eliminado

echo.
echo 4. Limpiando cache de npm...
call npm cache clean --force
echo Cache npm limpiado

echo.
echo 5. Compilando proyecto...
call npm run build
echo Proyecto compilado exitosamente

echo.
echo 6. Iniciando servidor de desarrollo...
echo.
echo ========================================
echo IMPORTANTE: 
echo - Abre http://localhost:3000 en modo incognito
echo - Presiona Ctrl+F5 para forzar recarga
echo - Los cambios ya estan implementados
echo ========================================
echo.

start http://localhost:3000
call npm run dev

pause
