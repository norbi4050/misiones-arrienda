@echo off
echo ========================================
echo SUBIR PROYECTO A GITHUB - VERSION FINAL
echo ========================================
echo.

echo Navegando al directorio Backend...
cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"

echo.
echo Estado actual de Git:
git status

echo.
echo ========================================
echo Los archivos eliminados son normales
echo (fueron archivos de documentacion limpiados)
echo ========================================
echo.

echo Agregando TODOS los cambios (incluyendo eliminaciones)...
git add -A

echo.
echo Verificando cambios agregados...
git status

echo.
echo Haciendo commit con todos los cambios...
git commit -m "Clean project: Remove documentation files and prepare for GitHub"

echo.
echo Verificando si el remote ya existe...
git remote -v

echo.
echo Agregando remote de GitHub (si no existe)...
git remote add origin https://github.com/norbi4050/misiones-arrienda.git 2>nul

echo.
echo Subiendo a GitHub...
git push -u origin main

echo.
echo ========================================
echo PROCESO COMPLETADO
echo ========================================
echo.
echo Si todo salio bien, tu proyecto deberia estar en:
echo https://github.com/norbi4050/misiones-arrienda
echo.
echo Si hay errores, es posible que necesites:
echo 1. Crear el repositorio manualmente en GitHub primero
echo 2. Verificar tu autenticacion de Git
echo.

pause
