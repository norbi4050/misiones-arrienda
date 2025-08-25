@echo off
echo ========================================
echo 🧹 LIMPIANDO BASE DE DATOS Y DESPLEGANDO
echo ========================================
echo.

echo PASO 1: Navegando a la carpeta Backend...
cd Backend

echo PASO 2: Limpiando base de datos...
echo DATABASE_URL="file:./dev.db" > .env
npx prisma db push --force-reset
npx prisma generate

echo PASO 3: Ejecutando seed limpio...
npx prisma db seed

echo PASO 4: Subiendo cambios a GitHub...
cd ..
git add .
git commit -m "Clean database - Ready for real users"
git push origin main

echo PASO 5: Desplegando a Vercel...
cd Backend
vercel --prod

echo.
echo ✅ PROCESO COMPLETADO
echo.
echo 🎯 RESULTADO:
echo - Base de datos limpia (sin propiedades de ejemplo)
echo - Cambios subidos a GitHub
echo - Sitio actualizado en Vercel
echo.
echo 🚀 LA PLATAFORMA ESTÁ LISTA PARA USUARIOS REALES
echo.
pause
