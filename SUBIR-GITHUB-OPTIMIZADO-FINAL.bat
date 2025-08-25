@echo off
echo ========================================
echo 🚀 SUBIENDO PROYECTO LIMPIO A GITHUB
echo ========================================
echo.

cd Backend

echo ✅ Verificando estado del repositorio...
git status

echo.
echo ✅ Subiendo a GitHub...
git push -u origin main

echo.
echo ========================================
echo 🎉 PROYECTO SUBIDO EXITOSAMENTE
echo ========================================
echo.
echo 📋 Próximos pasos:
echo 1. Ir a GitHub y verificar que el código esté subido
echo 2. Conectar repositorio con Vercel
echo 3. Configurar variables de entorno
echo 4. Deploy automático
echo.
echo 🌐 URL del repositorio: https://github.com/tu-usuario/Misiones-arrienda
echo.
pause
