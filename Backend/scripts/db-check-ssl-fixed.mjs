import pg from "pg";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

console.log("🔍 VERIFICANDO CONEXIÓN A BASE DE DATOS (SSL MEJORADO)...");
console.log("=====================================");

async function testConnection(sslConfig, description) {
  console.log(`\n🔧 Probando: ${description}`);
  
  try {
    // Verificar que existe la variable de entorno
    if (!process.env.DATABASE_URL) {
      console.log("❌ ERROR: Variable DATABASE_URL no encontrada");
      console.log("   Verifica que existe en tu archivo .env.local");
      return false;
    }

    console.log("✅ Variable DATABASE_URL encontrada");
    console.log("🔗 Intentando conectar a:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

    // Crear cliente PostgreSQL con configuración SSL específica
    const client = new pg.Client({ 
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig
    });

    // Conectar
    console.log("⏳ Conectando...");
    await client.connect();
    console.log("✅ Conexión establecida exitosamente");

    // Ejecutar query de prueba
    console.log("⏳ Ejecutando query de prueba...");
    const result = await client.query("SELECT NOW() as current_time, version() as db_version");
    
    console.log("✅ Query ejecutado exitosamente");
    console.log("📅 Tiempo actual DB:", result.rows[0].current_time);
    console.log("🗄️  Versión PostgreSQL:", result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]);

    // Verificar si existen tablas
    console.log("⏳ Verificando tablas existentes...");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tablesResult.rows.length > 0) {
      console.log("✅ Tablas encontradas:");
      tablesResult.rows.slice(0, 10).forEach(row => {
        console.log("   📋", row.table_name);
      });
      if (tablesResult.rows.length > 10) {
        console.log(`   ... y ${tablesResult.rows.length - 10} más`);
      }
    } else {
      console.log("⚠️  No se encontraron tablas en el schema 'public'");
      console.log("   Esto es normal si no has ejecutado las migraciones de Prisma");
    }

    // Cerrar conexión
    await client.end();
    console.log("✅ Conexión cerrada correctamente");
    
    console.log(`\n🎉 ÉXITO CON: ${description}`);
    return true;

  } catch (error) {
    console.log(`❌ FALLÓ CON: ${description}`);
    console.log("🔍 Error:", error.message);
    console.log("🔍 Código:", error.code);
    return false;
  }
}

async function main() {
  // Configuraciones SSL a probar en orden de preferencia
  const sslConfigs = [
    {
      config: {
        rejectUnauthorized: false,
        require: true
      },
      description: "SSL con certificados auto-firmados permitidos"
    },
    {
      config: {
        rejectUnauthorized: false
      },
      description: "SSL flexible (recomendado para desarrollo)"
    },
    {
      config: false,
      description: "Sin SSL (solo para desarrollo local)"
    },
    {
      config: {
        rejectUnauthorized: true,
        require: true
      },
      description: "SSL estricto (producción)"
    }
  ];

  let success = false;
  
  for (const { config, description } of sslConfigs) {
    const result = await testConnection(config, description);
    if (result) {
      success = true;
      console.log("\n=====================================");
      console.log("🎉 RESULTADO: BASE DE DATOS COMPLETAMENTE FUNCIONAL");
      console.log(`✅ Configuración SSL exitosa: ${description}`);
      console.log("=====================================");
      break;
    }
  }

  if (!success) {
    console.log("\n=====================================");
    console.log("❌ TODAS LAS CONFIGURACIONES SSL FALLARON");
    console.log("=====================================");
    
    console.log("\n💡 SOLUCIONES SUGERIDAS:");
    console.log("1. Verifica que el proyecto Supabase esté activo");
    console.log("2. Regenera las credenciales en Supabase Dashboard");
    console.log("3. Actualiza la variable DATABASE_URL en .env.local");
    console.log("4. Verifica la configuración de red/firewall");
    console.log("5. Contacta al soporte de Supabase si el problema persiste");
    
    process.exit(1);
  }
}

main().catch(console.error);
