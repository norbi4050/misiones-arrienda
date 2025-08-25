@echo off
echo ========================================
echo COMANDOS CORRECTOS PARA SUBIR A GITHUB
echo ========================================
echo.

echo 1. Primero, navega al directorio Backend:
echo cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
echo.

echo 2. Verifica el estado de Git:
echo git status
echo.

echo 3. Si no esta inicializado, ejecuta:
echo git init
echo.

echo 4. Agrega todos los archivos:
echo git add .
echo.

echo 5. Haz el commit:
echo git commit -m "Initial commit: Misiones Arrienda - Complete Next.js rental platform"
echo.

echo 6. Agrega el remote de GitHub:
echo git remote add origin https://github.com/norbi4050/misiones-arrienda.git
echo.

echo 7. Sube el codigo:
echo git push -u origin main
echo.

echo ========================================
echo EJECUTAR ESTOS COMANDOS UNO POR UNO
echo ========================================
echo.

echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo ¿Quieres que ejecute automaticamente los comandos? (S/N)
set /p respuesta=

if /i "%respuesta%"=="S" (
    echo.
    echo Ejecutando comandos automaticamente...
    echo.
    
    cd "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
    
    echo Verificando estado de Git...
    git status
    
    echo.
    echo Agregando archivos...
    git add .
    
    echo.
    echo Haciendo commit...
    git commit -m "Initial commit: Misiones Arrienda - Complete Next.js rental platform"
    
    echo.
    echo Agregando remote...
    git remote add origin https://github.com/norbi4050/misiones-arrienda.git
    
    echo.
    echo Subiendo a GitHub...
    git push -u origin main
    
    echo.
    echo ¡LISTO! El proyecto deberia estar en GitHub ahora.
    echo Verifica en: https://github.com/norbi4050/misiones-arrienda
    
) else (
    echo.
    echo Ejecuta los comandos manualmente uno por uno.
    echo Copia y pega cada comando en la terminal.
)

echo.
echo Presiona cualquier tecla para salir...
pause >nul
