@echo off
echo ========================================
echo CONTINUAR TESTING - GERARDO GONZALEZ
echo ========================================
echo.

echo 🚀 INICIANDO SERVIDOR DE DESARROLLO...
cd Backend
start "Servidor Next.js" cmd /k "npm run dev"

echo.
echo ⏳ Esperando que el servidor inicie completamente...
timeout /t 15 /nobreak

echo.
echo 🌐 Abriendo navegador para testing...
start http://localhost:3000

echo.
echo ========================================
echo 📋 PLAN DE TESTING COMPLETO
echo ========================================
echo.
echo 🔍 FASE 1: COMPLETAR REGISTRO DE GERARDO GONZALEZ
echo ------------------------------------------------
echo 1. Ir a: http://localhost:3000/register
echo 2. Completar formulario con estos datos:
echo    ✅ Tipo: Inquilino/Comprador (YA SELECCIONADO)
echo    ✅ Nombre: Gerardo González (YA COMPLETADO)
echo    ✅ Email: gerardo.gonzalez@test.com (YA COMPLETADO)
echo    📝 Teléfono: +54 376 123-4567
echo    📝 Contraseña: Test123456
echo    📝 Confirmar Contraseña: Test123456
echo    📝 Tipo de Propiedad: Casa o Departamento
echo    📝 Presupuesto: Seleccionar rango apropiado
echo    ☑️ Marcar: Acepto términos y condiciones
echo 3. Hacer clic en "Crear Cuenta"
echo.
echo 🔐 FASE 2: TESTING DE LOGIN
echo ---------------------------
echo 1. Ir a: http://localhost:3000/login
echo 2. Ingresar credenciales:
echo    📧 Email: gerardo.gonzalez@test.com
echo    🔑 Contraseña: Test123456
echo 3. Hacer clic en "Iniciar Sesión"
echo 4. ⚠️ VERIFICAR: Redirección inmediata al dashboard
echo.
echo 🏠 FASE 3: TESTING CRÍTICO DEL DASHBOARD
echo ----------------------------------------
echo ⚠️ AQUÍ ES DONDE EL USUARIO REPORTA ERRORES
echo.
echo ✅ VERIFICACIONES OBLIGATORIAS:
echo 1. 👤 Nombre mostrado: "Gerardo González" (NO "Carlos Mendoza")
echo 2. 📧 Email mostrado: gerardo.gonzalez@test.com
echo 3. 🏷️ Tipo de usuario: Inquilino
echo 4. 📊 Dashboard carga sin errores
echo.
echo 🚨 ERRORES A BUSCAR:
echo 1. ❌ Si aparece "Carlos Mendoza" en lugar de "Gerardo González"
echo 2. ❌ Si el dashboard no carga o muestra página en blanco
echo 3. ❌ Si hay errores en la consola del navegador (F12)
echo 4. ❌ Si las pestañas del dashboard no funcionan
echo 5. ❌ Si los datos del usuario son incorrectos
echo.
echo 🔧 TESTING DE FUNCIONALIDADES:
echo 1. 📑 Probar pestaña "Favoritos"
echo 2. 📈 Probar pestaña "Historial"
echo 3. 🏘️ Probar pestaña "Propiedades"
echo 4. 🔍 Realizar una búsqueda de propiedades
echo 5. ❤️ Agregar una propiedad a favoritos
echo 6. 📱 Verificar responsive design
echo.
echo 🌐 FASE 4: TESTING DE NAVEGACIÓN
echo --------------------------------
echo 1. 🏠 Probar enlace "Inicio"
echo 2. 🏘️ Probar enlace "Propiedades"
echo 3. 👥 Probar enlace "Perfiles"
echo 4. 📝 Probar enlace "Publicar"
echo 5. 🔍 Probar formulario de búsqueda principal
echo 6. 📍 Probar enlaces rápidos (Posadas, Oberá, Puerto Iguazú)
echo.
echo 🐛 FASE 5: DEBUGGING AVANZADO
echo -----------------------------
echo 1. Abrir DevTools (F12)
echo 2. Ir a pestaña "Console"
echo 3. Buscar errores JavaScript (texto en rojo)
echo 4. Ir a pestaña "Network"
echo 5. Verificar llamadas API fallidas (códigos 4xx, 5xx)
echo 6. Ir a pestaña "Application" ^> "Local Storage"
echo 7. Verificar datos almacenados del usuario
echo.
echo ========================================
echo 🚨 SOLUCIONES RÁPIDAS SI HAY ERRORES
echo ========================================
echo.
echo 💾 SI APARECE "CARLOS MENDOZA":
echo 1. Abrir DevTools (F12)
echo 2. Ir a "Application" ^> "Local Storage"
echo 3. Hacer clic derecho ^> "Clear"
echo 4. Refrescar página (F5)
echo 5. Hacer login nuevamente
echo.
echo 🔄 SI EL DASHBOARD NO CARGA:
echo 1. Verificar que el servidor esté corriendo
echo 2. Revisar consola por errores
echo 3. Intentar logout y login nuevamente
echo 4. Limpiar caché del navegador (Ctrl+Shift+R)
echo.
echo 📊 SI HAY ERRORES DE API:
echo 1. Verificar que la base de datos esté funcionando
echo 2. Revisar logs del servidor en la terminal
echo 3. Verificar variables de entorno
echo.
echo ========================================
echo 📝 REPORTE DE ERRORES
echo ========================================
echo.
echo Si encuentras errores, documenta:
echo 1. 📸 Captura de pantalla del error
echo 2. 📋 Pasos exactos para reproducir
echo 3. 🖥️ Información del navegador (Chrome, Firefox, etc.)
echo 4. 📜 Mensajes de error en consola (F12)
echo 5. 🌐 URL donde ocurre el error
echo.
echo ========================================
echo ✅ CRITERIOS DE ÉXITO
echo ========================================
echo.
echo El testing será EXITOSO si:
echo ✅ Registro se completa sin errores
echo ✅ Login redirige inmediatamente al dashboard
echo ✅ Dashboard muestra "Gerardo González" (NO Carlos Mendoza)
echo ✅ Todas las pestañas del dashboard funcionan
echo ✅ Búsqueda de propiedades funciona
echo ✅ Favoritos se pueden agregar/quitar
echo ✅ Navegación entre páginas sin errores
echo ✅ No hay errores en consola del navegador
echo.
echo ========================================
echo 🎯 OBJETIVO PRINCIPAL
echo ========================================
echo.
echo IDENTIFICAR Y DOCUMENTAR los errores específicos
echo que el usuario menciona que ocurren "una vez que
echo te logueas" para poder implementar las correcciones
echo necesarias.
echo.
echo ========================================
echo 🚀 COMENZAR TESTING
echo ========================================
echo.
echo El servidor debería estar iniciando...
echo El navegador se abrirá automáticamente.
echo.
echo ¡COMIENZA EL TESTING SIGUIENDO LAS FASES ARRIBA!
echo.
pause
