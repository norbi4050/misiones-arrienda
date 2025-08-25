@echo off
echo ========================================
echo    SOLUCION DEFINITIVA GITHUB
echo ========================================
echo.

echo PASO 1: Navegando a la carpeta correcta...
cd /d "C:\Users\Usuario\Desktop\Misiones-Arrienda"
echo Ubicacion actual: %CD%

echo.
echo PASO 2: Creando repositorio en GitHub.com manualmente...
echo.
echo ⚠️  IMPORTANTE: Debes crear el repositorio manualmente:
echo.
echo 1. Ve a: https://github.com/new
echo 2. Nombre del repositorio: Misiones-Arrienda
echo 3. Descripcion: Portal inmobiliario especializado en Misiones
echo 4. Marcar como PUBLICO
echo 5. NO marcar README, .gitignore, license (ya los tienes)
echo 6. Hacer clic en "Create repository"
echo.
echo Presiona ENTER cuando hayas creado el repositorio...
pause

echo.
echo PASO 3: Configurando remote con tu usuario...
git remote remove origin 2>nul
git remote add origin https://github.com/norbi4050/Misiones-Arrienda.git

echo.
echo PASO 4: Verificando que estamos en la rama main...
git branch -M main

echo.
echo PASO 5: Subiendo codigo a GitHub...
git push -u origin main

echo.
echo PASO 6: Verificacion final...
echo Tu repositorio deberia estar en:
echo https://github.com/norbi4050/Misiones-Arrienda
echo.

echo ========================================
echo ✅ PROCESO COMPLETADO
echo ========================================
echo.
echo Si ves errores, verifica que:
echo 1. Creaste el repositorio en GitHub.com
echo 2. El nombre es exactamente: Misiones-Arrienda
echo 3. Tu usuario es: norbi4050
echo.
pause
