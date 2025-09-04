@echo off
echo ========================================
echo APLICANDO CORRECCIONES DE SUPABASE
echo ========================================
echo.

echo 1. Verificando variables de entorno...
node verificar-supabase-env.js
if errorlevel 1 (
    echo ❌ Error en variables de entorno
    echo Por favor revisa tu archivo .env
    pause
    exit /b 1
)

echo.
echo 2. Las correcciones SQL deben aplicarse manualmente en Supabase Dashboard:
echo.
echo 📁 SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql
echo    - Ve a Supabase Dashboard > SQL Editor
echo    - Copia y pega el contenido del archivo
echo    - Ejecuta el script
echo.
echo 📁 SUPABASE-CORRECCION-AUTH.sql  
echo    - Ve a Supabase Dashboard > SQL Editor
echo    - Copia y pega el contenido del archivo
echo    - Ejecuta el script
echo.
echo 3. Después de aplicar los scripts SQL, ejecuta:
echo    node TESTING-FUNCIONAL-SUPABASE-EN-VIVO-COMPLETO.js
echo.
echo ========================================
echo CORRECCIONES PREPARADAS
echo ========================================
pause