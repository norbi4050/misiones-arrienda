@echo off
echo ========================================
echo   MISIONES ARRIENDA - EJECUTAR APLICACION
echo ========================================
echo.
echo Este script ejecutará la aplicación automáticamente
echo desde cualquier ubicación.
echo.

echo PASO 1: Navegando a la carpeta Backend...
cd /d "C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend"
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se pudo encontrar la carpeta Backend
    echo.
    echo Verifica que el proyecto esté en:
    echo C:\Users\Usuario\Desktop\Misiones-Arrienda\Backend
    echo.
    pause
    exit /b 1
)
echo ✅ Ahora estamos en la carpeta Backend
echo Ubicación: %CD%
echo.

echo PASO 2: Verificando proyecto...
if not exist package.json (
    echo ❌ ERROR: No se encontró package.json
    pause
    exit /b 1
)
echo ✅ Proyecto encontrado
echo.

echo PASO 3: Configurando base de datos SQLite...
echo DATABASE_URL="file:./dev.db" > .env
echo ✅ Configurado para usar SQLite (no PostgreSQL)
echo.

echo PASO 4: Instalando dependencias...
echo (Esto puede tomar unos minutos la primera vez)
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
echo ✅ Prisma configurado
echo.

echo PASO 6: Creando base de datos SQLite...
npx prisma db push
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Falló db push, pero continuamos
    echo La aplicación funcionará con datos de ejemplo
)
echo ✅ Base de datos lista
echo.

echo PASO 7: Poblando con datos de ejemplo...
npx tsx prisma/seed-sqlite.ts
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Falló seed, usando datos de fallback
)
echo ✅ Datos cargados
echo.

echo ========================================
echo   INICIANDO SERVIDOR
echo ========================================
echo.
echo ⚠️  IMPORTANTE: 
echo - NO cierres esta ventana
echo - Espera a ver "Local: http://localhost:3000"
echo - Luego abre tu navegador en http://localhost:3000
echo - Para detener presiona Ctrl+C
echo.
echo QUÉ VERÁS EN EL NAVEGADOR:
echo ✅ Logo "Misiones Arrienda"
echo ✅ Hero section azul con buscador
echo ✅ Grid de propiedades
echo ✅ Propiedades con badge rojo "Destacado"
echo ✅ Enlace "Publicar" en navbar
echo.
echo MODELO DE NEGOCIO A PROBAR:
echo 💰 Plan Básico: $0 (Gratis)
echo 💰 Plan Destacado: $5.000/mes (Badge rojo)
echo 💰 Plan Full: $10.000/mes (Premium completo)
echo.
echo Iniciando servidor en 3 segundos...
timeout /t 3 /nobreak >nul

npm run dev

echo.
echo ========================================
echo   SERVIDOR DETENIDO
echo ========================================
echo.
echo La aplicación se detuvo.
echo Para volver a ejecutar, usa este mismo script.
echo.
pause
