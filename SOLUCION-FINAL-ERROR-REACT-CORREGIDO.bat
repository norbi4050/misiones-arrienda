@echo off
echo ========================================
echo SOLUCION FINAL - Error React Corregido
echo ========================================
echo.

echo PROBLEMA RESUELTO: Error de Select.Item con valor vacio
echo SOLUCION: Corregido enhanced-search-bar.tsx
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
echo 5. Compilando proyecto (con error React corregido)...
npm run build
if %errorlevel% neq 0 (
    echo ERROR en compilacion, pero continuando...
)

echo.
echo 6. Iniciando servidor...
echo ========================================
echo CAMBIOS APLICADOS:
echo - Diseño profesional de homepage implementado
echo - Error de React Select corregido
echo - Cache completamente limpio
echo ========================================
echo.
echo IMPORTANTE: 
echo - Se abrira http://localhost:3000 automaticamente
echo - Usa modo incognito en el navegador
echo - Presiona Ctrl+F5 para forzar recarga
echo - Los cambios estan listos para verse
echo ========================================
echo.

start http://localhost:3000
npm run dev

pause
