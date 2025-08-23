@echo off
echo ========================================
echo    MISIONES ARRIENDA - EJECUTAR PROYECTO
echo ========================================
echo.

echo Navegando a la carpeta Backend...
cd /d "%~dp0"

echo.
echo Verificando ubicacion actual:
echo %CD%
echo.

echo Verificando que package.json existe...
if not exist package.json (
    echo ERROR: No se encuentra package.json
    echo Asegurate de estar en la carpeta Backend
    pause
    exit /b 1
)

echo ✅ package.json encontrado
echo.

echo Instalando dependencias...
call npm install

echo.
echo Configurando base de datos...
call npm run db:generate
call npm run db:push
call npm run db:seed

echo.
echo ========================================
echo    INICIANDO SERVIDOR DE DESARROLLO
echo ========================================
echo.
echo El servidor se iniciara en: http://localhost:3000
echo Presiona Ctrl+C para detener el servidor
echo.

call npm run dev

pause
