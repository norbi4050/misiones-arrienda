@echo off
echo.
echo ========================================
echo 🚀 PROBANDO MEJORAS COMPLETAS
echo ========================================
echo.

echo 📍 Ubicación actual: %CD%
echo.

echo PASO 1: Verificando que estamos en la ubicación correcta...
if not exist "Backend" (
    echo ❌ ERROR: No se encuentra la carpeta Backend
    echo Debes ejecutar este archivo desde la carpeta Misiones-Arrienda
    pause
    exit /b 1
)

echo ✅ Carpeta Backend encontrada
echo.

echo PASO 2: Navegando a Backend...
cd Backend

echo PASO 3: Verificando archivos críticos...
if exist "src\components\whatsapp-button.tsx" (
    echo ✅ WhatsApp Button - IMPLEMENTADO
) else (
    echo ❌ WhatsApp Button - FALTA
)

if exist "src\app\api\stats\route.ts" (
    echo ✅ API Stats Reales - IMPLEMENTADA
) else (
    echo ❌ API Stats - FALTA
)

if exist "src\components\stats-section.tsx" (
    echo ✅ Stats Section Mejorada - IMPLEMENTADA
) else (
    echo ❌ Stats Section - FALTA
)

echo.
echo PASO 4: Verificando dependencias...
echo Instalando react-hot-toast si no está...
call npm install react-hot-toast --silent

echo.
echo PASO 5: Iniciando servidor de desarrollo...
echo.
echo 🌟 MEJORAS IMPLEMENTADAS:
echo ✅ WhatsApp Integration (Botón flotante + mensajes automáticos)
echo ✅ Contadores Reales (API conectada a base de datos)
echo ✅ Página Detalle Mejorada (UX profesional + WhatsApp)
echo ✅ Sistema Notificaciones (Toast en toda la app)
echo ✅ Formularios Avanzados (Validaciones + estados de carga)
echo ✅ SEO Básico (Meta tags + Schema.org)
echo.
echo 🎯 QUÉ PROBAR:
echo 1. Botón WhatsApp flotante (esquina inferior derecha)
echo 2. Contadores animados en sección estadísticas
echo 3. Click en cualquier propiedad → página detalle mejorada
echo 4. Formularios de login/register con validaciones
echo 5. Notificaciones toast en todas las acciones
echo.
echo 🚀 Iniciando en http://localhost:3000
echo.

call npm run dev

pause
