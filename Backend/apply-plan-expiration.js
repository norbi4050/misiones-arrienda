const fs = require('fs')
const path = require('path')

console.log('📋 MIGRACIÓN: Sistema de Auto-Expiración de Planes\n')
console.log('=' .repeat(60))
console.log('\n📁 Archivo: migrations/auto_expire_plans_system.sql')
console.log('\n📝 Para aplicar esta migración:')
console.log('\n1. Abre tu Supabase Dashboard')
console.log('2. Ve a SQL Editor')
console.log('3. Copia el contenido del archivo mostrado abajo')
console.log('4. Pégalo en el editor y ejecútalo')
console.log('\n' + '=' .repeat(60))
console.log('\n📄 CONTENIDO DEL ARCHIVO SQL:\n')
console.log('=' .repeat(60))

const sqlContent = fs.readFileSync(
  path.join(__dirname, 'migrations', 'auto_expire_plans_system.sql'),
  'utf8'
)

console.log(sqlContent)

console.log('\n' + '=' .repeat(60))
console.log('\n✅ Funciones que se crearán:')
console.log('  1. expire_user_plan(user_uuid) - Expira un plan individual')
console.log('  2. deactivate_excess_properties(user_uuid, max) - Desactiva propiedades excedentes')
console.log('  3. reactivate_properties_on_upgrade(user_uuid, max) - Reactiva al mejorar plan')
console.log('  4. expire_all_expired_plans() - Expira todos los planes vencidos (cron)')
console.log('\n📊 Columnas que se agregarán a properties:')
console.log('  - deactivated_reason (VARCHAR)')
console.log('  - deactivated_at (TIMESTAMPTZ)')
console.log('\n🔍 Índices que se crearán para performance')
console.log('\n')
