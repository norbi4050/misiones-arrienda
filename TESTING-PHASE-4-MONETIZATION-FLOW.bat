@echo off
echo ========================================
echo 🚀 TESTING PHASE 4: MONETIZATION FLOW
echo ========================================
echo.

echo ✅ Verificando dependencias instaladas...
cd Backend
if exist "node_modules\react-hot-toast" (
    echo    ✓ react-hot-toast instalado correctamente
) else (
    echo    ❌ react-hot-toast NO encontrado
    echo    Instalando dependencia...
    npm install react-hot-toast
)
echo.

echo ✅ Verificando archivos implementados...
if exist "src\app\publicar\page.tsx" (
    echo    ✓ /publicar page actualizada
) else (
    echo    ❌ /publicar page NO encontrada
)

if exist "src\app\api\properties\create\route.ts" (
    echo    ✓ API /properties/create implementada
) else (
    echo    ❌ API /properties/create NO encontrada
)
echo.

echo ✅ Compilando TypeScript...
npx tsc --noEmit
if %errorlevel% equ 0 (
    echo    ✓ Compilación exitosa - Sin errores TypeScript
) else (
    echo    ❌ Errores de compilación detectados
    echo    Revisa los archivos TypeScript
)
echo.

echo ✅ Iniciando servidor de desarrollo...
echo    📍 Abriendo http://localhost:3000/publicar
echo    🔍 Verifica manualmente:
echo       - Formulario Step 1 con validación
echo       - Planes de monetización Step 2  
echo       - Confirmación y pago Step 3
echo       - Loading states y toast notifications
echo.

start http://localhost:3000/publicar
npm run dev

pause
