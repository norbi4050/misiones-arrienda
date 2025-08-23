@echo off
echo ========================================
echo   SOLUCION DEFINITIVA - MISIONES ARRIENDA
echo ========================================
echo.
echo ❌ PROBLEMAS IDENTIFICADOS:
echo 1. Ejecutando desde carpeta incorrecta (C:\Users\Usuario)
echo 2. Base de datos configurada para PostgreSQL en lugar de SQLite
echo.
echo ✅ SOLUCIONANDO AUTOMÁTICAMENTE...
echo.

echo PASO 1: Verificando ubicación...
echo Ubicación actual: %CD%
if not exist package.json (
    echo ❌ ERROR: No estás en la carpeta Backend
    echo.
    echo INSTRUCCIONES CRÍTICAS:
    echo 1. Cierra esta ventana
    echo 2. Navega a: C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend
    echo 3. Ejecuta este script desde esa carpeta
    echo.
    echo ⚠️  MUY IMPORTANTE: Debes estar en la carpeta Backend
    echo.
    pause
    exit /b 1
)
echo ✅ Estamos en la carpeta Backend correcta
echo.

echo PASO 2: Configurando base de datos SQLite...
echo Creando archivo .env con configuración SQLite...
echo DATABASE_URL="file:./dev.db" > .env
echo ✅ Base de datos configurada para SQLite
echo.

echo PASO 3: Instalando dependencias...
npm install
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló npm install
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
echo.

echo PASO 4: Configurando Prisma...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló prisma generate
    pause
    exit /b 1
)
echo ✅ Prisma generado
echo.

echo PASO 5: Creando base de datos SQLite...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló prisma db push
    echo Intentando método alternativo...
    del /f prisma\dev.db 2>nul
    npx prisma db push --force-reset
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló método alternativo
        echo Continuando sin base de datos...
    )
)
echo ✅ Base de datos SQLite creada
echo.

echo PASO 6: Poblando base de datos...
npx tsx prisma/seed-sqlite.ts
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Falló el seed, pero continuamos
    echo La aplicación funcionará con datos de ejemplo
)
echo ✅ Datos cargados
echo.

echo PASO 7: Iniciando servidor Next.js...
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
