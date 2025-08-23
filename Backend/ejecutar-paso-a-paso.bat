@echo off
echo ========================================
echo   EJECUTAR PASO A PASO - MISIONES ARRIENDA
echo ========================================
echo.
echo Vamos a ejecutar cada paso manualmente para identificar el problema.
echo.

echo PASO 1: Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    echo Descargar desde: https://nodejs.org/
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)
echo ✅ Node.js OK
echo.

echo PASO 2: Verificando npm...
npm --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm no funciona
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)
echo ✅ npm OK
echo.

echo PASO 3: Instalando dependencias...
echo (Esto puede tomar unos minutos)
npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló npm install
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

echo PASO 4: Configurando base de datos...
npx prisma generate
npx prisma db push --force-reset
npx tsx prisma/seed-sqlite.ts
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló configuración de base de datos
    echo.
    echo Presiona cualquier tecla para continuar...
    pause >nul
    exit /b 1
)
echo ✅ Base de datos configurada
echo.

echo PASO 5: Iniciando servidor...
echo.
echo ⚠️  IMPORTANTE: 
echo - NO cierres esta ventana
echo - El servidor se iniciará en unos segundos
echo - Verás "Local: http://localhost:3000" cuando esté listo
echo - Abre tu navegador en http://localhost:3000
echo.
echo Para detener el servidor presiona Ctrl+C
echo.
echo Iniciando en 3 segundos...
timeout /t 3 /nobreak >nul

npm run dev

echo.
echo El servidor se detuvo.
echo Presiona cualquier tecla para cerrar...
pause >nul
