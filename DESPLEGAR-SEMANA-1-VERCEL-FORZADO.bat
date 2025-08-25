@echo off
echo ========================================
echo   DESPLEGANDO SEMANA 1 A VERCEL
echo ========================================
echo.

echo [1/5] Verificando directorio Backend...
cd Backend
if %errorlevel% neq 0 (
    echo ❌ Error: No se pudo acceder al directorio Backend
    pause
    exit /b 1
)

echo ✅ Directorio Backend encontrado
echo.

echo [2/5] Verificando estado de Git...
git status
echo.

echo [3/5] Generando cliente Prisma actualizado...
npx prisma generate
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Error al generar cliente Prisma
)

echo.
echo [4/5] Aplicando cambios a base de datos...
npx prisma db push
if %errorlevel% neq 0 (
    echo ⚠️  Advertencia: Error al aplicar cambios de BD
)

echo.
echo [5/5] Desplegando a Vercel (FORZADO)...
echo.
echo ========================================
echo   🚀 INICIANDO DEPLOYMENT FORZADO...
echo ========================================
echo.
echo 📋 CAMBIOS A DESPLEGAR:
echo.
echo ✅ Sistema de Favoritos completo
echo ✅ Historial de Búsquedas automático
echo ✅ Dashboard mejorado con 3 pestañas
echo ✅ Botones de favoritos en Property Cards
echo ✅ APIs backend con autenticación JWT
echo ✅ Base de datos actualizada (SearchHistory)
echo.
echo ⏳ Desplegando a www.misionesarrienda.com.ar...
echo.

vercel --prod --force --yes
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ DEPLOYMENT EXITOSO
    echo ========================================
    echo.
    echo 🎉 Los cambios de la Semana 1 han sido desplegados exitosamente!
    echo.
    echo 🌐 Página web: www.misionesarrienda.com.ar
    echo.
    echo 📋 FUNCIONALIDADES DISPONIBLES:
    echo.
    echo ❤️  Sistema de Favoritos:
    echo    - Haz hover sobre las property cards para ver el botón de favoritos
    echo    - Regístrate/inicia sesión para usar la funcionalidad
    echo.
    echo 📊 Dashboard Mejorado:
    echo    - Ve a /dashboard después de iniciar sesión
    echo    - Pestaña "Mis Favoritos" para ver propiedades guardadas
    echo    - Pestaña "Historial de Búsquedas" para acceso rápido
    echo    - Pestaña "Explorar Propiedades" con accesos directos
    echo.
    echo 🔍 Historial de Búsquedas:
    echo    - Se guarda automáticamente al buscar
    echo    - Acceso rápido desde el dashboard
    echo    - Gestión manual del historial
    echo.
    echo 🔐 Autenticación Mejorada:
    echo    - APIs protegidas con JWT
    echo    - Datos seguros y privados por usuario
    echo.
    echo ⏰ Los cambios pueden tardar 1-2 minutos en propagarse globalmente.
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ ERROR EN DEPLOYMENT
    echo ========================================
    echo.
    echo 🔧 Intentando deployment alternativo...
    echo.
    
    vercel --prod
    if %errorlevel% equ 0 (
        echo ✅ Deployment alternativo exitoso!
    ) else (
        echo ❌ Error en deployment alternativo
        echo.
        echo 💡 SOLUCIONES POSIBLES:
        echo.
        echo 1. Verificar conexión a internet
        echo 2. Verificar autenticación de Vercel: vercel login
        echo 3. Verificar configuración del proyecto: vercel link
        echo 4. Intentar deployment manual desde Vercel dashboard
        echo.
    )
)

echo.
echo ========================================
echo   DEPLOYMENT COMPLETADO
echo ========================================
echo.
echo 🌐 Visita: www.misionesarrienda.com.ar
echo 📱 Prueba las nuevas funcionalidades!
echo.
pause
