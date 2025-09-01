@echo off
echo ========================================
echo 57. TESTING ERROR REGISTRO CORREGIDO
echo ========================================
echo.
echo Este script probara el endpoint de registro mejorado
echo para verificar que el error "Database error saving new user" 
echo ha sido solucionado correctamente.
echo.
pause

echo.
echo ========================================
echo PASO 1: VERIFICAR SERVIDOR ACTIVO
echo ========================================
echo.
echo Verificando si el servidor esta ejecutandose...
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 (
    echo ❌ Servidor no esta activo
    echo.
    echo Iniciando servidor...
    cd Backend
    start "Servidor Next.js" cmd /k "npm run dev"
    echo.
    echo ⏳ Esperando 10 segundos para que el servidor inicie...
    timeout /t 10 /nobreak > nul
    cd ..
) else (
    echo ✅ Servidor esta activo
)

echo.
echo ========================================
echo PASO 2: TESTING ENDPOINT REGISTRO
echo ========================================
echo.

echo 🧪 TEST 1: Registro de usuario inquilino
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Juan Perez\",\"email\":\"juan.test@example.com\",\"phone\":\"+54 376 123-4567\",\"password\":\"123456\",\"userType\":\"inquilino\"}"
echo.
echo.

echo 🧪 TEST 2: Registro de usuario dueño directo
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Maria Rodriguez\",\"email\":\"maria.test@example.com\",\"phone\":\"+54 376 987-6543\",\"password\":\"123456\",\"userType\":\"dueno_directo\",\"propertyCount\":3}"
echo.
echo.

echo 🧪 TEST 3: Registro de inmobiliaria
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Carlos Mendoza\",\"email\":\"carlos.test@example.com\",\"phone\":\"+54 376 555-1234\",\"password\":\"123456\",\"userType\":\"inmobiliaria\",\"companyName\":\"Inmobiliaria Posadas\",\"licenseNumber\":\"INM-2024-001\"}"
echo.
echo.

echo 🧪 TEST 4: Validación de campos faltantes
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\"}"
echo.
echo.

echo 🧪 TEST 5: Validación de email inválido
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"email-invalido\",\"phone\":\"+54 376 123-4567\",\"password\":\"123456\",\"userType\":\"inquilino\"}"
echo.
echo.

echo 🧪 TEST 6: Validación de contraseña corta
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test2@example.com\",\"phone\":\"+54 376 123-4567\",\"password\":\"123\",\"userType\":\"inquilino\"}"
echo.
echo.

echo 🧪 TEST 7: Usuario duplicado
echo.
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Juan Perez\",\"email\":\"juan.test@example.com\",\"phone\":\"+54 376 123-4567\",\"password\":\"123456\",\"userType\":\"inquilino\"}"
echo.
echo.

echo ========================================
echo PASO 3: VERIFICAR LOGS DEL SERVIDOR
echo ========================================
echo.
echo Revisa la consola del servidor para ver los logs detallados.
echo Los logs ahora incluyen:
echo - ✅ Verificación de variables de entorno
echo - ✅ Validaciones mejoradas con códigos de error
echo - ✅ Verificación de conectividad con Supabase
echo - ✅ Manejo de rollback en caso de errores
echo - ✅ Logging estructurado con timestamps
echo.

echo ========================================
echo PASO 4: ANÁLISIS DE RESULTADOS
echo ========================================
echo.
echo RESULTADOS ESPERADOS:
echo.
echo TEST 1-3: Registro exitoso (201)
echo - Respuesta con usuario creado
echo - Campos completos y correctos
echo - Tiempo de procesamiento incluido
echo.
echo TEST 4: Error 400 - Campos faltantes
echo - Código: MISSING_REQUIRED_FIELDS
echo - Lista específica de campos faltantes
echo.
echo TEST 5: Error 400 - Email inválido
echo - Código: INVALID_EMAIL_FORMAT
echo - Mensaje descriptivo del error
echo.
echo TEST 6: Error 400 - Contraseña corta
echo - Código: PASSWORD_TOO_SHORT
echo - Requisitos de contraseña especificados
echo.
echo TEST 7: Error 409 - Usuario duplicado
echo - Código: USER_ALREADY_EXISTS
echo - Mensaje claro sobre duplicación
echo.

echo ========================================
echo PASO 5: VERIFICAR MEJORAS IMPLEMENTADAS
echo ========================================
echo.
echo ✅ MEJORAS IMPLEMENTADAS:
echo.
echo 1. VERIFICACIÓN DE VARIABLES DE ENTORNO
echo    - Validación explícita de SUPABASE_URL
echo    - Validación explícita de SERVICE_ROLE_KEY
echo    - Errores específicos si faltan variables
echo.
echo 2. LOGGING MEJORADO
echo    - Prefijo [REGISTRO] en todos los logs
echo    - Timestamps en respuestas de error
echo    - Códigos de error específicos
echo    - Tiempo de procesamiento incluido
echo.
echo 3. VALIDACIONES ROBUSTAS
echo    - Parseo seguro de JSON
echo    - Validación de campos requeridos
echo    - Validación específica por tipo de usuario
echo    - Regex mejorado para email
echo.
echo 4. VERIFICACIÓN DE CONECTIVIDAD
echo    - Health check de base de datos
echo    - Detección de tabla users faltante
echo    - Manejo de errores de conexión
echo.
echo 5. MANEJO DE ERRORES ESPECÍFICOS
echo    - Rollback automático en caso de fallo
echo    - Códigos de error únicos
echo    - Mensajes descriptivos
echo    - Logging detallado de excepciones
echo.

echo ========================================
echo PASO 6: PRÓXIMOS PASOS
echo ========================================
echo.
echo Si los tests son exitosos:
echo 1. ✅ El error "Database error saving new user" está solucionado
echo 2. ✅ El sistema de registro es más robusto
echo 3. ✅ Los errores son más informativos
echo 4. ✅ El debugging es más fácil
echo.
echo Si hay errores:
echo 1. Revisar logs del servidor para detalles específicos
echo 2. Verificar variables de entorno en .env.local
echo 3. Confirmar que Supabase está configurado correctamente
echo 4. Verificar que la tabla users existe
echo.

echo ========================================
echo TESTING COMPLETADO
echo ========================================
echo.
echo El endpoint de registro ha sido mejorado significativamente:
echo - Mejor manejo de errores
echo - Logging más detallado
echo - Validaciones más robustas
echo - Códigos de error específicos
echo - Rollback automático
echo.
echo Revisa los resultados de los tests arriba para confirmar
echo que el error "Database error saving new user" ha sido solucionado.
echo.
pause
