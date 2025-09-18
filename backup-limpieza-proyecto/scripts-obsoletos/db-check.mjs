import pg from "pg";

console.log("🔍 VERIFICANDO CONEXIÓN A BASE DE DATOS...");
console.log("=====================================");

try {
  // Verificar que existe la variable de entorno
  if (!process.env.DATABASE_URL) {
    console.log("❌ ERROR: Variable DATABASE_URL no encontrada");
    console.log("   Verifica que existe en tu archivo .env.local");
    process.exit(1);
  }

  console.log("✅ Variable DATABASE_URL encontrada");
  console.log("🔗 Intentando conectar a:", process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

  // Crear cliente PostgreSQL
  const client = new pg.Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      require: true
    }
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
    tablesResult.rows.forEach(row => {
      console.log("   📋", row.table_name);
    });
  } else {
    console.log("⚠️  No se encontraron tablas en el schema 'public'");
    console.log("   Esto es normal si no has ejecutado las migraciones de Prisma");
  }

  // Cerrar conexión
  await client.end();
  console.log("✅ Conexión cerrada correctamente");
  
  console.log("\n🎉 RESULTADO: BASE DE DATOS COMPLETAMENTE FUNCIONAL");
  console.log("=====================================");

} catch (error) {
  console.log("❌ ERROR DE CONEXIÓN:");
  console.log("=====================================");
  
  if (error.code === 'ENOTFOUND') {
    console.log("🔍 Problema: Servidor no encontrado");
    console.log("   - Verifica que la URL de Supabase sea correcta");
    console.log("   - El proyecto Supabase podría estar pausado o eliminado");
  } else if (error.code === 'ECONNREFUSED') {
    console.log("🔍 Problema: Conexión rechazada");
    console.log("   - El servidor existe pero rechaza la conexión");
    console.log("   - Verifica las credenciales de acceso");
  } else if (error.message.includes('password authentication failed')) {
    console.log("🔍 Problema: Credenciales incorrectas");
    console.log("   - Verifica el usuario y contraseña en DATABASE_URL");
  } else {
    console.log("🔍 Error técnico:", error.message);
    console.log("🔍 Código de error:", error.code);
  }
  
  console.log("\n💡 SOLUCIONES SUGERIDAS:");
  console.log("1. Verifica que el proyecto Supabase esté activo");
  console.log("2. Regenera las credenciales en Supabase Dashboard");
  console.log("3. Actualiza la variable DATABASE_URL en .env.local");
  
  process.exit(1);
}
