@echo off
echo ========================================
echo 🔍 TESTING INTEGRACIÓN SUPABASE Y AUTENTICACIÓN
echo ========================================
echo.

echo 📋 Verificando dependencias...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado
    echo 💡 Instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm no está disponible
    pause
    exit /b 1
)

echo ✅ Node.js y npm detectados

echo.
echo 📦 Instalando dependencias de testing...
npm install puppeteer --save-dev
if %errorlevel% neq 0 (
    echo ❌ Error instalando puppeteer
    pause
    exit /b 1
)

echo.
echo 🚀 Verificando servidor...
echo 💡 Asegúrate de que el servidor esté ejecutándose en otra terminal:
echo    cd Backend
echo    npm run dev
echo.
echo ⏳ Esperando 5 segundos para verificar servidor...
timeout /t 5 /nobreak >nul

echo.
echo 🔍 Ejecutando testing de integración...
node test-integracion-supabase-autenticacion-completo.js

echo.
echo 📊 Testing completado. Revisa el reporte generado:
echo    - REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FINAL.md
echo    - Screenshots generados (test-*.png)
echo.

if exist "REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FINAL.md" (
    echo ✅ Reporte generado exitosamente
    echo.
    echo 📖 ¿Deseas abrir el reporte? (S/N)
    set /p choice=
    if /i "%choice%"=="S" (
        start "" "REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FINAL.md"
    )
) else (
    echo ⚠️ No se pudo generar el reporte
)

echo.
echo 🎯 PRÓXIMOS PASOS:
echo 1. Revisar el reporte generado
echo 2. Corregir problemas identificados
echo 3. Verificar configuración de Supabase
echo 4. Probar funcionalidad de autenticación
echo.
pause
