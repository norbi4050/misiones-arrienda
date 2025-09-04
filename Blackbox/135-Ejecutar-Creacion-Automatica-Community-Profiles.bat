@echo off
echo ========================================
echo BLACKBOX AI - CREACION AUTOMATICA TABLA COMMUNITY_PROFILES
echo Fecha: 3 de Enero 2025
echo ========================================
echo.

echo 🚀 Ejecutando creación automática con credenciales reales...
echo 📋 Intentando TODOS los métodos disponibles:
echo    1. DATABASE_URL (pgbouncer)
echo    2. DIRECT_URL (conexión directa)
echo    3. Supabase REST API
echo    4. Creación por partes (método 1)
echo    5. Creación por partes (método 2)
echo.

cd /d "%~dp0.."
node "Blackbox/134-Script-Creacion-Automatica-Community-Profiles-Con-Credenciales-Reales.js"

echo.
echo ✅ Proceso completado
echo 📄 Revisa el reporte en: Blackbox/134-Reporte-Creacion-Automatica-Community-Profiles.json
echo.

if exist "Blackbox/134-Reporte-Creacion-Automatica-Community-Profiles.json" (
    echo 📊 PRÓXIMOS PASOS:
    echo.
    echo Si la creación fue EXITOSA:
    echo   ✅ Ejecutar: Blackbox/132-Ejecutar-Testing-Post-Creacion-Community-Profiles.bat
    echo.
    echo Si la creación FALLÓ:
    echo   📖 Seguir guía manual: Blackbox/130-Guia-Manual-Crear-Tabla-Community-Profiles-Supabase.md
    echo.
)

pause
