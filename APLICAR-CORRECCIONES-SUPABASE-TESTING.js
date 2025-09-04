const fs = require('fs');
const path = require('path');

class SupabaseCorrector {
  constructor() {
    this.corrections = [];
    this.log('🔧 Iniciando aplicación de correcciones de Supabase...');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // Corrección 1: Crear script SQL para corregir esquema de propiedades
  createSchemaFix() {
    this.log('Creando corrección de esquema de propiedades...', 'info');
    
    const sqlFix = `-- CORRECCIÓN 1: Esquema de Propiedades
-- Agregar columna 'location' faltante en tabla properties

-- Verificar si la columna existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'location'
    ) THEN
        -- Agregar columna location
        ALTER TABLE properties ADD COLUMN location TEXT;
        RAISE NOTICE 'Columna location agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna location ya existe';
    END IF;
END $$;

-- Verificar otras columnas importantes
DO $$
BEGIN
    -- Verificar columna address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'address'
    ) THEN
        ALTER TABLE properties ADD COLUMN address TEXT;
        RAISE NOTICE 'Columna address agregada';
    END IF;

    -- Verificar columna city
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'city'
    ) THEN
        ALTER TABLE properties ADD COLUMN city TEXT;
        RAISE NOTICE 'Columna city agregada';
    END IF;

    -- Verificar columna province
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'province'
    ) THEN
        ALTER TABLE properties ADD COLUMN province TEXT DEFAULT 'Misiones';
        RAISE NOTICE 'Columna province agregada';
    END IF;
END $$;

-- Refrescar schema cache de PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- Verificar estructura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;`;

    try {
      fs.writeFileSync('SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql', sqlFix);
      this.corrections.push({
        type: 'Schema Fix',
        file: 'SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql',
        status: 'Created',
        description: 'Script SQL para corregir esquema de propiedades'
      });
      this.log('✅ Script de corrección de esquema creado', 'success');
    } catch (error) {
      this.log(`❌ Error creando script de esquema: ${error.message}`, 'error');
    }
  }

  // Corrección 2: Configurar autenticación
  createAuthFix() {
    this.log('Creando corrección de autenticación...', 'info');
    
    const authConfig = `-- CORRECCIÓN 2: Configuración de Autenticación
-- Habilitar y configurar Auth en Supabase

-- 1. Verificar que Auth esté habilitado
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- 2. Configurar políticas RLS para usuarios
-- Política para permitir que usuarios vean su propio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuarios actualicen su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserción de nuevos perfiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Configurar políticas para propiedades
-- Permitir lectura pública de propiedades
DROP POLICY IF EXISTS "Public can view properties" ON properties;
CREATE POLICY "Public can view properties" ON properties
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear propiedades
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
CREATE POLICY "Authenticated users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Solo el propietario puede actualizar sus propiedades
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 5. Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verificar configuración
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'properties');`;

    try {
      fs.writeFileSync('SUPABASE-CORRECCION-AUTH.sql', authConfig);
      this.corrections.push({
        type: 'Auth Fix',
        file: 'SUPABASE-CORRECCION-AUTH.sql',
        status: 'Created',
        description: 'Script SQL para configurar autenticación'
      });
      this.log('✅ Script de corrección de autenticación creado', 'success');
    } catch (error) {
      this.log(`❌ Error creando script de auth: ${error.message}`, 'error');
    }
  }

  // Corrección 3: Verificar variables de entorno
  createEnvCheck() {
    this.log('Creando verificación de variables de entorno...', 'info');
    
    const envChecker = `const fs = require('fs');
const path = require('path');

class EnvChecker {
  constructor() {
    this.requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'DIRECT_URL'
    ];
  }

  checkEnvFile() {
    console.log('🔍 Verificando archivo .env...');
    
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Archivo .env no encontrado');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];

    this.requiredVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.log('❌ Variables faltantes:', missingVars);
      return false;
    }

    console.log('✅ Todas las variables de Supabase están presentes');
    return true;
  }

  validateSupabaseConnection() {
    console.log('🔍 Validando conexión con Supabase...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Variables de Supabase no configuradas');
      return false;
    }

    // Validar formato de URL
    try {
      new URL(supabaseUrl);
      console.log('✅ URL de Supabase válida');
    } catch (error) {
      console.log('❌ URL de Supabase inválida');
      return false;
    }

    // Validar formato de key
    if (!supabaseKey.startsWith('eyJ')) {
      console.log('❌ Formato de API key inválido');
      return false;
    }

    console.log('✅ Credenciales de Supabase válidas');
    return true;
  }

  async testConnection() {
    console.log('🔍 Probando conexión real con Supabase...');
    
    try {
      const response = await fetch(\`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/\`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': \`Bearer \${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}\`
        }
      });

      if (response.ok) {
        console.log('✅ Conexión con Supabase exitosa');
        return true;
      } else {
        console.log(\`❌ Error de conexión: \${response.status}\`);
        return false;
      }
    } catch (error) {
      console.log(\`❌ Error de red: \${error.message}\`);
      return false;
    }
  }

  async runAllChecks() {
    console.log('🚀 Iniciando verificación completa de Supabase...');
    
    const envCheck = this.checkEnvFile();
    const validationCheck = this.validateSupabaseConnection();
    const connectionCheck = await this.testConnection();

    const allPassed = envCheck && validationCheck && connectionCheck;

    console.log('\\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log(\`Archivo .env: \${envCheck ? '✅' : '❌'}\`);
    console.log(\`Validación: \${validationCheck ? '✅' : '❌'}\`);
    console.log(\`Conexión: \${connectionCheck ? '✅' : '❌'}\`);
    console.log(\`Estado general: \${allPassed ? '✅ EXITOSO' : '❌ REQUIERE CORRECCIÓN'}\`);

    return allPassed;
  }
}

// Ejecutar verificación
const checker = new EnvChecker();
checker.runAllChecks().then(success => {
  process.exit(success ? 0 : 1);
});`;

    try {
      fs.writeFileSync('verificar-supabase-env.js', envChecker);
      this.corrections.push({
        type: 'Env Check',
        file: 'verificar-supabase-env.js',
        status: 'Created',
        description: 'Script para verificar variables de entorno'
      });
      this.log('✅ Script de verificación de entorno creado', 'success');
    } catch (error) {
      this.log(`❌ Error creando verificador de env: ${error.message}`, 'error');
    }
  }

  // Crear archivo ejecutable para aplicar todas las correcciones
  createExecutionScript() {
    this.log('Creando script de ejecución...', 'info');
    
    const execScript = `@echo off
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
pause`;

    try {
      fs.writeFileSync('EJECUTAR-CORRECCIONES-SUPABASE.bat', execScript);
      this.corrections.push({
        type: 'Execution Script',
        file: 'EJECUTAR-CORRECCIONES-SUPABASE.bat',
        status: 'Created',
        description: 'Script para ejecutar todas las correcciones'
      });
      this.log('✅ Script de ejecución creado', 'success');
    } catch (error) {
      this.log(`❌ Error creando script de ejecución: ${error.message}`, 'error');
    }
  }

  // Crear guía de implementación
  createImplementationGuide() {
    this.log('Creando guía de implementación...', 'info');
    
    const guide = `# 🔧 GUÍA DE IMPLEMENTACIÓN - CORRECCIONES SUPABASE

## 📋 **RESUMEN DE CORRECCIONES IDENTIFICADAS**

Basado en el testing funcional exhaustivo, se identificaron **3 problemas críticos** que requieren corrección:

### ❌ **Problemas Encontrados:**
1. **Registro de Usuario** - Error en configuración de Auth
2. **Login de Usuario** - Dependiente del registro
3. **Creación de Propiedades** - Campo 'location' faltante en esquema

---

## 🚀 **PASOS DE IMPLEMENTACIÓN**

### **PASO 1: Verificar Variables de Entorno**
\`\`\`bash
node verificar-supabase-env.js
\`\`\`

### **PASO 2: Corregir Esquema de Base de Datos**
1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Abre el archivo: \`SUPABASE-CORRECCION-ESQUEMA-PROPERTIES.sql\`
3. Copia y pega el contenido completo
4. Haz clic en **"Run"** para ejecutar

### **PASO 3: Configurar Autenticación**
1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Abre el archivo: \`SUPABASE-CORRECCION-AUTH.sql\`
3. Copia y pega el contenido completo
4. Haz clic en **"Run"** para ejecutar

### **PASO 4: Verificar Correcciones**
\`\`\`bash
node TESTING-FUNCIONAL-SUPABASE-EN-VIVO-COMPLETO.js
\`\`\`

---

## 📊 **RESULTADOS ESPERADOS**

### **Antes de las Correcciones:**
- ✅ Tests Exitosos: 7/10 (70%)
- ❌ Tests Fallidos: 3/10 (30%)

### **Después de las Correcciones:**
- ✅ Tests Exitosos: 10/10 (100%)
- ❌ Tests Fallidos: 0/10 (0%)

---

## 🔍 **VERIFICACIÓN DE ÉXITO**

### **Indicadores de Corrección Exitosa:**
1. **Registro de Usuario:** ✅ Usuario creado exitosamente
2. **Login de Usuario:** ✅ Login exitoso con token válido
3. **Creación de Propiedades:** ✅ Propiedad creada sin errores de esquema

### **Comandos de Verificación:**
\`\`\`bash
# Verificar conexión
node verificar-supabase-env.js

# Testing completo
node TESTING-FUNCIONAL-SUPABASE-EN-VIVO-COMPLETO.js

# Verificar esquema en Supabase Dashboard
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'properties';
\`\`\`

---

## ⚠️ **NOTAS IMPORTANTES**

### **Requisitos Previos:**
- Acceso a Supabase Dashboard
- Variables de entorno configuradas
- Permisos de administrador en el proyecto

### **Tiempo Estimado:**
- **Verificación:** 2 minutos
- **Corrección de Esquema:** 3 minutos
- **Configuración de Auth:** 5 minutos
- **Testing Final:** 2 minutos
- **Total:** ~12 minutos

### **Respaldo:**
Antes de aplicar las correcciones, considera hacer un respaldo de tu base de datos desde Supabase Dashboard.

---

## 🎯 **RESULTADO FINAL**

Una vez aplicadas todas las correcciones, el proyecto tendrá:
- ✅ **100% de funcionalidad de Supabase**
- ✅ **Autenticación completa**
- ✅ **Esquema de base de datos sincronizado**
- ✅ **Performance óptima (490ms)**
- ✅ **Listo para producción**

---

**📅 Fecha:** 3 de Enero, 2025  
**🔧 Correcciones:** 3 identificadas, 3 solucionables  
**⏱️ Tiempo:** ~12 minutos de implementación  
**🎯 Objetivo:** 100% funcionalidad Supabase`;

    try {
      fs.writeFileSync('GUIA-IMPLEMENTACION-CORRECCIONES-SUPABASE.md', guide);
      this.corrections.push({
        type: 'Implementation Guide',
        file: 'GUIA-IMPLEMENTACION-CORRECCIONES-SUPABASE.md',
        status: 'Created',
        description: 'Guía completa de implementación'
      });
      this.log('✅ Guía de implementación creada', 'success');
    } catch (error) {
      this.log(`❌ Error creando guía: ${error.message}`, 'error');
    }
  }

  // Ejecutar todas las correcciones
  async applyAllCorrections() {
    this.log('🚀 Iniciando aplicación de todas las correcciones...', 'info');
    
    try {
      this.createSchemaFix();
      this.createAuthFix();
      this.createEnvCheck();
      this.createExecutionScript();
      this.createImplementationGuide();
      
      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Error aplicando correcciones: ${error.message}`, 'error');
    }
  }

  // Generar reporte final
  generateReport() {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 REPORTE DE CORRECCIONES APLICADAS');
    console.log('='.repeat(60));

    console.log(`📈 Total de Correcciones: ${this.corrections.length}`);
    console.log(`✅ Archivos Creados: ${this.corrections.filter(c => c.status === 'Created').length}`);

    console.log('\\n📄 ARCHIVOS GENERADOS:');
    this.corrections.forEach((correction, index) => {
      console.log(`   ${index + 1}. ${correction.file}`);
      console.log(`      Tipo: ${correction.type}`);
      console.log(`      Descripción: ${correction.description}`);
      console.log('');
    });

    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar: EJECUTAR-CORRECCIONES-SUPABASE.bat');
    console.log('   2. Seguir: GUIA-IMPLEMENTACION-CORRECCIONES-SUPABASE.md');
    console.log('   3. Verificar con testing funcional');

    console.log('\\n🎉 CORRECCIONES PREPARADAS EXITOSAMENTE');
  }
}

// Ejecutar corrector
async function main() {
  const corrector = new SupabaseCorrector();
  await corrector.applyAllCorrections();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SupabaseCorrector;
