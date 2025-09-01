@echo off
echo ========================================
echo 🧪 PROBAR REGISTRO CON NUEVA CONFIGURACION
echo ========================================
echo.

echo 📋 INSTRUCCIONES PARA PROBAR EL REGISTRO:
echo.
echo 1. ABRIR PRIMERA TERMINAL (para el servidor):
echo    cd Backend
echo    npm run dev
echo.
echo 2. ABRIR SEGUNDA TERMINAL (para las pruebas):
echo    Ejecutar los comandos cURL que aparecerán abajo
echo.
echo 3. VERIFICAR RESULTADOS:
echo    - Status 201 = ✅ Registro exitoso
echo    - Status 400 = ❌ Error de validación  
echo    - Status 409 = ⚠️  Usuario ya existe
echo    - Status 500 = 🔥 Error de servidor/base de datos
echo.

echo ========================================
echo 🚀 COMANDOS CURL PARA PROBAR
echo ========================================
echo.

echo 📝 PRUEBA 1: Usuario Inquilino
echo curl -X POST http://localhost:3000/api/auth/register ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"name\":\"Juan Test\",\"email\":\"juan.test@misionesarrienda.com\",\"phone\":\"+54 376 123456\",\"password\":\"password123\",\"userType\":\"inquilino\"}"
echo.

echo 📝 PRUEBA 2: Dueño Directo
echo curl -X POST http://localhost:3000/api/auth/register ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"name\":\"Maria Propietaria\",\"email\":\"maria.duena@misionesarrienda.com\",\"phone\":\"+54 376 654321\",\"password\":\"password456\",\"userType\":\"dueno_directo\",\"propertyCount\":2}"
echo.

echo 📝 PRUEBA 3: Inmobiliaria
echo curl -X POST http://localhost:3000/api/auth/register ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"name\":\"Carlos Inmobiliario\",\"email\":\"carlos.inmobiliaria@misionesarrienda.com\",\"phone\":\"+54 376 789012\",\"password\":\"password789\",\"userType\":\"inmobiliaria\",\"companyName\":\"Inmobiliaria Test SA\",\"licenseNumber\":\"IMB-12345\"}"
echo.

echo ========================================
echo 🔍 QUE VERIFICAR DESPUÉS
echo ========================================
echo.
echo ✅ RESPUESTA EXITOSA (Status 201):
echo {
echo   "message": "Usuario registrado exitosamente.",
echo   "user": {
echo     "id": "uuid-generado",
echo     "name": "Nombre Usuario",
echo     "email": "email@ejemplo.com",
echo     "userType": "tipo_usuario",
echo     "emailVerified": true
echo   },
echo   "emailSent": true,
echo   "emailConfigured": true
echo }
echo.

echo 🔥 ERROR COMÚN (Status 500):
echo {
echo   "error": "Error interno del servidor",
echo   "details": "Database error saving new user"
echo }
echo.

echo ========================================
echo 📊 VERIFICAR EN SUPABASE DASHBOARD
echo ========================================
echo.
echo 1. Ir a tu proyecto Supabase
echo 2. Authentication ^> Users
echo    - Debe aparecer el usuario creado
echo.
echo 3. Table Editor ^> users  
echo    - Debe aparecer el perfil del usuario
echo.

echo ========================================
echo 🎯 PRÓXIMOS PASOS SEGÚN RESULTADO
echo ========================================
echo.
echo ✅ SI FUNCIONA:
echo    - ¡Perfecto! El registro está funcionando
echo    - Puedes continuar con el desarrollo
echo.
echo ❌ SI FALLA:
echo    - Revisar logs del servidor (terminal 1)
echo    - Verificar variables de entorno en .env.local
echo    - Comprobar conectividad con Supabase
echo    - Revisar políticas RLS en Supabase
echo.

echo ========================================
echo 🚀 ¡LISTO PARA PROBAR!
echo ========================================
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
