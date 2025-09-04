const fs = require('fs');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        console.log('✅ Conexión con Supabase exitosa');
        return true;
      } else {
        console.log(`❌ Error de conexión: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error de red: ${error.message}`);
      return false;
    }
  }

  async runAllChecks() {
    console.log('🚀 Iniciando verificación completa de Supabase...');
    
    const envCheck = this.checkEnvFile();
    const validationCheck = this.validateSupabaseConnection();
    const connectionCheck = await this.testConnection();

    const allPassed = envCheck && validationCheck && connectionCheck;

    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log(`Archivo .env: ${envCheck ? '✅' : '❌'}`);
    console.log(`Validación: ${validationCheck ? '✅' : '❌'}`);
    console.log(`Conexión: ${connectionCheck ? '✅' : '❌'}`);
    console.log(`Estado general: ${allPassed ? '✅ EXITOSO' : '❌ REQUIERE CORRECCIÓN'}`);

    return allPassed;
  }
}

// Ejecutar verificación
const checker = new EnvChecker();
checker.runAllChecks().then(success => {
  process.exit(success ? 0 : 1);
});