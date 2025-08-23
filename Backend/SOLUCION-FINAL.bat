@echo off
echo ========================================
echo   SOLUCIÓN FINAL - MISIONES ARRIENDA
echo ========================================
echo.
echo ❌ PROBLEMA IDENTIFICADO:
echo Los comandos se están ejecutando desde la carpeta incorrecta
echo.
echo ✅ SOLUCIÓN:
echo Este script se ejecutará desde la carpeta Backend correcta
echo.

echo PASO 1: Verificando que estamos en la carpeta correcta...
if not exist package.json (
    echo ❌ ERROR: No estás en la carpeta Backend
    echo.
    echo INSTRUCCIONES:
    echo 1. Navega a la carpeta Backend
    echo 2. Ejecuta este script desde ahí
    echo.
    pause
    exit /b 1
)
echo ✅ Estamos en la carpeta Backend correcta
echo.

echo PASO 2: Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js no está instalado
    pause
    exit /b 1
)
echo ✅ Node.js OK
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

echo PASO 4: Configurando base de datos SQLite (sin servidor)...
echo Usando SQLite local en lugar de servidor de base de datos...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló prisma generate
    pause
    exit /b 1
)

echo Creando base de datos SQLite...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló prisma db push
    pause
    exit /b 1
)

echo Poblando base de datos...
npx tsx prisma/seed-sqlite.ts
if %errorlevel% neq 0 (
    echo ❌ ERROR: Falló el seed
    echo Intentando método alternativo...
    node -r esbuild-register prisma/seed-sqlite.ts
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Falló método alternativo también
        echo Continuando sin datos de ejemplo...
    )
)
echo ✅ Base de datos configurada
echo.

echo PASO 5: Iniciando servidor Next.js...
echo.
echo ⚠️  IMPORTANTE: 
echo - NO cierres esta ventana
echo - El servidor se iniciará en unos segundos
echo - Verás "Local: http://localhost:3000" cuando esté listo
echo - Abre tu navegador en http://localhost:3000
echo.
echo Para detener el servidor presiona Ctrl+C
echo.

npm run dev

echo.
echo El servidor se detuvo.
pause
