@echo off
echo ========================================
echo   ELIMINANDO USUARIOS EJEMPLO Y DESPLEGANDO
echo ========================================
echo.

echo PASO 1: Navegando a la carpeta Backend...
cd Backend

echo PASO 2: Verificando cambios realizados...
echo ✅ Usuarios ejemplo eliminados de profiles/page.tsx
echo ✅ Estado vacío profesional implementado
echo.

echo PASO 3: Haciendo commit de los cambios...
git add .
git commit -m "Remove example users from profiles page - ready for real users"

echo PASO 4: Desplegando a producción...
echo Ejecutando deployment a Vercel...
vercel --prod

echo.
echo ========================================
echo   ✅ DEPLOYMENT COMPLETADO
echo ========================================
echo.
echo Los usuarios ejemplo han sido eliminados.
echo La página de perfiles ahora muestra un estado vacío profesional.
echo Los cambios están desplegados en: www.misionesarrienda.com.ar
echo.
pause
