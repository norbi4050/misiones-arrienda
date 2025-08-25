@echo off
echo.
echo ========================================
echo 🚀 SUBIENDO MISIONES-ARRIENDA A GITHUB
echo ========================================
echo.

echo 📋 VERIFICANDO ESTADO ACTUAL...
git status
echo.

echo 📝 HISTORIAL DE COMMITS:
git log --oneline -3
echo.

echo ⚠️  IMPORTANTE: 
echo 1. Debes crear el repositorio en GitHub primero:
echo    - Ir a: https://github.com/new
echo    - Nombre: Misiones-Arrienda
echo    - Descripción: Portal inmobiliario especializado en Misiones - Next.js + Prisma + MercadoPago
echo    - Público (recomendado)
echo    - NO marcar README, .gitignore o license
echo.

echo 2. Después ejecuta estos comandos (reemplaza TU-USUARIO):
echo.
echo    git remote add origin https://github.com/TU-USUARIO/Misiones-Arrienda.git
echo    git branch -M main
echo    git push -u origin main
echo.

echo 🎯 DESPUÉS DE SUBIR:
echo - Tu proyecto estará en: https://github.com/TU-USUARIO/Misiones-Arrienda
echo - Podrás proceder con Netlify deployment
echo - El README.md se verá profesional en GitHub
echo.

echo 📖 GUÍAS DISPONIBLES:
echo - COMANDOS-GITHUB.md: Instrucciones detalladas
echo - README.md: Documentación del proyecto
echo - TODO.md: Estado del progreso
echo.

pause
