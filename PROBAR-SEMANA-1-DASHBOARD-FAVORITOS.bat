@echo off
echo ========================================
echo    TESTING SEMANA 1: DASHBOARD Y FAVORITOS
echo ========================================
echo.

echo [1/5] Verificando estructura de archivos...
if exist "Backend\src\app\api\favorites\route.ts" (
    echo ✅ API de Favoritos encontrada
) else (
    echo ❌ API de Favoritos NO encontrada
)

if exist "Backend\src\app\api\search-history\route.ts" (
    echo ✅ API de Historial encontrada
) else (
    echo ❌ API de Historial NO encontrada
)

if exist "Backend\src\components\favorite-button.tsx" (
    echo ✅ Componente FavoriteButton encontrado
) else (
    echo ❌ Componente FavoriteButton NO encontrado
)

if exist "Backend\src\components\search-history.tsx" (
    echo ✅ Componente SearchHistory encontrado
) else (
    echo ❌ Componente SearchHistory NO encontrado
)

echo.
echo [2/5] Verificando dependencias...
cd Backend
echo Verificando jsonwebtoken y bcryptjs...
npm list jsonwebtoken bcryptjs 2>nul
if %errorlevel% equ 0 (
    echo ✅ Dependencias de autenticación instaladas
) else (
    echo ⚠️  Instalando dependencias faltantes...
    npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
)

echo.
echo [3/5] Generando cliente Prisma...
npx prisma generate
if %errorlevel% equ 0 (
    echo ✅ Cliente Prisma generado correctamente
) else (
    echo ❌ Error al generar cliente Prisma
)

echo.
echo [4/5] Aplicando cambios a la base de datos...
npx prisma db push
if %errorlevel% equ 0 (
    echo ✅ Base de datos actualizada correctamente
) else (
    echo ❌ Error al actualizar base de datos
)

echo.
echo [5/5] Iniciando servidor de desarrollo...
echo.
echo ========================================
echo   🚀 SERVIDOR INICIANDO...
echo ========================================
echo.
echo 📋 FUNCIONALIDADES A PROBAR:
echo.
echo 1. 🏠 Página Principal (http://localhost:3000)
echo    - Botones de favoritos en property cards
echo    - Hover effects y animaciones
echo.
echo 2. 📝 Registro/Login (http://localhost:3000/register)
echo    - Crear cuenta nueva
echo    - Iniciar sesión
echo.
echo 3. 📊 Dashboard (http://localhost:3000/dashboard)
echo    - Pestaña "Mis Favoritos"
echo    - Pestaña "Historial de Búsquedas"
echo    - Estadísticas de usuario
echo.
echo 4. ❤️  Sistema de Favoritos
echo    - Agregar/quitar favoritos
echo    - Sincronización entre páginas
echo    - Persistencia en base de datos
echo.
echo 5. 🔍 Historial de Búsquedas
echo    - Tracking automático
echo    - Acceso rápido a búsquedas anteriores
echo    - Limpieza de historial
echo.
echo ========================================
echo   ⚡ INICIANDO EN 3 SEGUNDOS...
echo ========================================
timeout /t 3 /nobreak >nul

npm run dev

echo.
echo ========================================
echo   TESTING COMPLETADO
echo ========================================
pause
