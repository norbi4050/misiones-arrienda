@echo off
echo ========================================
echo   EJECUTAR DESDE CUALQUIER LUGAR
echo ========================================
echo.
echo Este script te llevará automáticamente a la carpeta correcta
echo y ejecutará la aplicación.
echo.

echo PASO 1: Navegando a la carpeta Backend...
cd /d "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudo encontrar la carpeta Backend
    echo Verifica que la ruta sea correcta
    pause
    exit /b 1
)
echo ✅ Ahora estamos en la carpeta Backend
echo Ubicación actual: %CD%
echo.

echo PASO 2: Verificando archivos del proyecto...
if not exist package.json (
    echo ❌ ERROR: No se encontró package.json
    echo La carpeta no contiene el proyecto
    pause
    exit /b 1
)
echo ✅ Proyecto encontrado
echo.

echo PASO 3: Configurando base de datos SQLite...
echo DATABASE_URL="file:./dev.db" > .env
echo ✅ Base de datos configurada para SQLite
echo.

echo PASO 4: Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló npm install
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

echo PASO 5: Configurando Prisma...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló prisma generate
    pause
    exit /b 1
)
echo.

echo PASO 6: Creando base de datos...
npx prisma db push
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Falló db push, pero continuamos
)
echo.

echo PASO 7: Poblando base de datos...
npx tsx prisma/seed-sqlite.ts
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Falló seed, pero continuamos
)
echo.

echo PASO 8: Iniciando servidor...
echo.
echo ========================================
echo   SERVIDOR INICIANDO
echo ========================================
echo.
echo ⚠️  IMPORTANTE: 
echo - NO cierres esta ventana
echo - Espera a ver "Local: http://localhost:3000"
echo - Luego abre tu navegador en http://localhost:3000
echo - Para detener presiona Ctrl+C
echo.
echo Iniciando en 3 segundos...
timeout /t 3 /nobreak >nul

npm run dev

echo.
echo ========================================
echo   SERVIDOR DETENIDO
echo ========================================
pause
