/**
 * Script para marcar inmobiliarias como miembros fundadores
 *
 * Uso:
 *   node scripts/mark-as-founder.js EMAIL_INMOBILIARIA
 *
 * Ejemplo:
 *   node scripts/mark-as-founder.js inmobiliaria@ejemplo.com
 *
 * Este script:
 * 1. Busca la inmobiliaria por email
 * 2. La marca como fundador (is_founder = true)
 * 3. Le asigna el plan professional gratis por 12 meses
 * 4. Le otorga 50% de descuento permanente
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegurate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function markAsFounder(email) {
  console.log(`\n🔍 Buscando inmobiliaria: ${email}`)

  // Buscar usuario por email
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('user_type', 'inmobiliaria')
    .single()

  if (findError || !user) {
    console.error('❌ No se encontró la inmobiliaria con ese email')
    console.error('Asegurate de que:')
    console.error('  1. El email es correcto')
    console.error('  2. El usuario existe')
    console.error('  3. El user_type es "inmobiliaria"')
    return false
  }

  console.log(`✅ Inmobiliaria encontrada:`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Nombre: ${user.company_name || user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Plan actual: ${user.plan_tier || 'free'}`)
  console.log(`   Es fundador: ${user.is_founder ? 'SÍ' : 'NO'}`)

  // Si ya es fundador, preguntar si quiere continuar
  if (user.is_founder) {
    console.log('\n⚠️  Esta inmobiliaria YA es miembro fundador')
    console.log('¿Deseas actualizar sus datos de todos modos? (esto reiniciará su período de 12 meses)')
  }

  // Calcular fechas
  const now = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 12) // 12 meses desde ahora

  console.log(`\n📅 Configurando plan fundador:`)
  console.log(`   Plan: Professional`)
  console.log(`   Inicio: ${now.toISOString()}`)
  console.log(`   Fin: ${endDate.toISOString()} (12 meses)`)
  console.log(`   Descuento: 50% permanente`)

  // Actualizar usuario
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({
      is_founder: true,
      founder_discount: 50,
      plan_tier: 'professional',
      plan_start_date: now.toISOString(),
      plan_end_date: endDate.toISOString(),
      updated_at: now.toISOString()
    })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error al actualizar:', updateError)
    return false
  }

  console.log('\n✅ ¡Éxito! Inmobiliaria marcada como fundador')
  console.log('\n📊 Estado final:')
  console.log(`   Es fundador: ${updated.is_founder ? 'SÍ' : 'NO'}`)
  console.log(`   Plan: ${updated.plan_tier}`)
  console.log(`   Descuento: ${updated.founder_discount}%`)
  console.log(`   Inicio: ${updated.plan_start_date}`)
  console.log(`   Fin período gratis: ${updated.plan_end_date}`)
  console.log(`\n🎉 Después de los 12 meses, pagará $13,750/mes (50% off de $27,500)`)

  return true
}

async function listFounders() {
  console.log('\n📋 Listado de miembros fundadores:\n')

  const { data: founders, error } = await supabase
    .from('users')
    .select('id, email, company_name, name, plan_tier, plan_start_date, plan_end_date, founder_discount')
    .eq('user_type', 'inmobiliaria')
    .eq('is_founder', true)
    .order('plan_start_date', { ascending: true })

  if (error) {
    console.error('❌ Error al listar fundadores:', error)
    return
  }

  if (!founders || founders.length === 0) {
    console.log('   No hay fundadores registrados todavía')
    return
  }

  console.log(`   Total: ${founders.length}/15 fundadores\n`)

  founders.forEach((founder, index) => {
    const daysRemaining = founder.plan_end_date
      ? Math.ceil((new Date(founder.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24))
      : 0

    console.log(`   ${index + 1}. ${founder.company_name || founder.name}`)
    console.log(`      Email: ${founder.email}`)
    console.log(`      Plan: ${founder.plan_tier}`)
    console.log(`      Días restantes gratis: ${daysRemaining > 0 ? daysRemaining : 'Expirado'}`)
    console.log(`      Descuento: ${founder.founder_discount}%`)
    console.log('')
  })

  console.log(`\n   Lugares disponibles: ${15 - founders.length}`)
}

// Main
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('\n📖 Uso del script:\n')
  console.log('  Marcar como fundador:')
  console.log('    node scripts/mark-as-founder.js EMAIL_INMOBILIARIA\n')
  console.log('  Listar fundadores:')
  console.log('    node scripts/mark-as-founder.js --list\n')
  console.log('  Ejemplos:')
  console.log('    node scripts/mark-as-founder.js inmobiliaria@ejemplo.com')
  console.log('    node scripts/mark-as-founder.js --list\n')
  process.exit(0)
}

if (args[0] === '--list' || args[0] === '-l') {
  listFounders()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
} else {
  const email = args[0]
  markAsFounder(email)
    .then(success => {
      if (success) {
        console.log('\n✅ Operación completada exitosamente')
        process.exit(0)
      } else {
        console.log('\n❌ La operación falló')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}
