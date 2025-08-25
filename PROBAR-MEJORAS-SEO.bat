@echo off
echo ========================================
echo    PROBANDO MEJORAS SEO IMPLEMENTADAS
echo ========================================
echo.

echo 🔍 VERIFICANDO ARCHIVOS MODIFICADOS...
echo.

echo ✅ 1. Verificando página principal (SSR)...
if exist "Backend\src\app\page.tsx" (
    echo    ✓ Backend\src\app\page.tsx - ENCONTRADO
) else (
    echo    ✗ Backend\src\app\page.tsx - NO ENCONTRADO
)

echo ✅ 2. Verificando API con propiedades de ejemplo...
if exist "Backend\src\lib\api.ts" (
    echo    ✓ Backend\src\lib\api.ts - ENCONTRADO
) else (
    echo    ✗ Backend\src\lib\api.ts - NO ENCONTRADO
)

echo ✅ 3. Verificando componente PropertyGrid mejorado...
if exist "Backend\src\components\property-grid.tsx" (
    echo    ✓ Backend\src\components\property-grid.tsx - ENCONTRADO
) else (
    echo    ✗ Backend\src\components\property-grid.tsx - NO ENCONTRADO
)

echo ✅ 4. Verificando página de detalle SSR...
if exist "Backend\src\app\property\[id]\page.tsx" (
    echo    ✓ Backend\src\app\property\[id]\page.tsx - ENCONTRADO
) else (
    echo    ✗ Backend\src\app\property\[id]\page.tsx - NO ENCONTRADO
)

echo ✅ 5. Verificando componente cliente de detalle...
if exist "Backend\src\app\property\[id]\property-detail-client.tsx" (
    echo    ✓ Backend\src\app\property\[id]\property-detail-client.tsx - ENCONTRADO
) else (
    echo    ✗ Backend\src\app\property\[id]\property-detail-client.tsx - NO ENCONTRADO
)

echo.
echo 🚀 INICIANDO SERVIDOR PARA PROBAR...
echo.

cd Backend
echo Instalando dependencias si es necesario...
call npm install --silent

echo.
echo 🌐 Iniciando servidor de desarrollo...
echo.
echo INSTRUCCIONES PARA PROBAR:
echo.
echo 1. El servidor se abrirá en http://localhost:3000
echo 2. Verifica que se muestren las 6 propiedades de ejemplo
echo 3. Haz clic en una propiedad para ver la página de detalle
echo 4. Verifica los metadatos SEO en el código fuente (Ctrl+U)
echo 5. Busca el JSON-LD structured data en el código
echo.
echo ⚠️  IMPORTANTE: Deja esta ventana abierta mientras pruebas
echo.

start http://localhost:3000
call npm run dev

pause
