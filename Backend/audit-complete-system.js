const { PrismaClient } = require('@prisma/client')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value) process.env[key] = value
    }
  })
}

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function auditCompleteSystem() {
  console.log('='.repeat(80))
  console.log('AUDITORÍA COMPLETA DEL SISTEMA DE USUARIOS Y PERFILES')
  console.log('='.repeat(80))

  // ========== PARTE 1: ESQUEMA DE USUARIOS ==========
  console.log('\n📊 PARTE 1: ANÁLISIS DE USUARIOS EN EL SISTEMA\n')

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      user_type: true,
      avatar: true,
      profile_image: true,
      logo_url: true,
      is_company: true,
      company_name: true,
    },
    take: 10
  })

  console.log(`Total usuarios encontrados: ${allUsers.length}\n`)

  for (const user of allUsers) {
    console.log(`Usuario: ${user.name} (${user.email})`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Tipo: ${user.user_type}`)
    console.log(`  Es Empresa: ${user.is_company}`)
    console.log(`  Nombre Empresa: ${user.company_name || 'N/A'}`)
    console.log(`  Avatar (users.avatar): ${user.avatar || 'NULL'}`)
    console.log(`  Profile Image (users.profile_image): ${user.profile_image || 'NULL'}`)
    console.log(`  Logo URL (users.logo_url): ${user.logo_url || 'NULL'}`)
    console.log('')
  }

  // ========== PARTE 2: USERPROFILES ==========
  console.log('\n📊 PARTE 2: ANÁLISIS DE USERPROFILES\n')

  const allProfiles = await prisma.userProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          user_type: true,
          avatar: true,
          is_company: true
        }
      }
    },
    take: 10
  })

  console.log(`Total UserProfiles encontrados: ${allProfiles.length}\n`)

  for (const profile of allProfiles) {
    console.log(`UserProfile ID: ${profile.id}`)
    console.log(`  Usuario: ${profile.user.name} (${profile.user.email})`)
    console.log(`  User ID: ${profile.userId}`)
    console.log(`  User Type: ${profile.user.user_type}`)
    console.log(`  Role (UserProfile): ${profile.role}`)
    console.log(`  Avatar URL (user_profiles.avatar_url): ${profile.avatar_url || 'NULL'}`)
    console.log(`  Avatar (users.avatar): ${profile.user.avatar || 'NULL'}`)
    console.log(`  Display Name: ${profile.display_name || 'N/A'}`)
    console.log(`  Created: ${profile.createdAt}`)
    console.log(`  Updated: ${profile.updatedAt}`)
    console.log('')
  }

  // ========== PARTE 3: VERIFICAR CASOS ESPECÍFICOS ==========
  console.log('\n📊 PARTE 3: CASOS DE USO ESPECÍFICOS\n')

  // Cesar (inmobiliaria)
  const cesar = await prisma.user.findUnique({
    where: { id: 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' },
    include: {
      UserProfile: true
    }
  })

  console.log('CASO 1: CESAR (Inmobiliaria)')
  console.log('─'.repeat(60))
  if (cesar) {
    console.log(`User.id: ${cesar.id}`)
    console.log(`User.name: ${cesar.name}`)
    console.log(`User.user_type: ${cesar.user_type}`)
    console.log(`User.is_company: ${cesar.is_company}`)
    console.log(`User.avatar: ${cesar.avatar || 'NULL'}`)
    console.log(`User.logo_url: ${cesar.logo_url || 'NULL'}`)
    console.log(`User.company_name: ${cesar.company_name || 'NULL'}`)

    if (cesar.UserProfile) {
      console.log(`\nTiene UserProfile: SÍ`)
      console.log(`  UserProfile.id: ${cesar.UserProfile.id}`)
      console.log(`  UserProfile.role: ${cesar.UserProfile.role}`)
      console.log(`  UserProfile.avatar_url: ${cesar.UserProfile.avatar_url || 'NULL'}`)
      console.log(`  UserProfile.display_name: ${cesar.UserProfile.display_name || 'NULL'}`)
    } else {
      console.log(`\nTiene UserProfile: NO`)
    }
  } else {
    console.log('❌ Usuario no encontrado')
  }

  // Carlos (inquilino)
  const carlos = await prisma.user.findUnique({
    where: { id: '6403f9d2-e846-4c70-87e0-e051127d9500' },
    include: {
      UserProfile: true
    }
  })

  console.log('\n\nCASO 2: CARLOS (Inquilino)')
  console.log('─'.repeat(60))
  if (carlos) {
    console.log(`User.id: ${carlos.id}`)
    console.log(`User.name: ${carlos.name}`)
    console.log(`User.user_type: ${carlos.user_type}`)
    console.log(`User.is_company: ${carlos.is_company}`)
    console.log(`User.avatar: ${carlos.avatar || 'NULL'}`)
    console.log(`User.profile_image: ${carlos.profile_image || 'NULL'}`)

    if (carlos.UserProfile) {
      console.log(`\nTiene UserProfile: SÍ`)
      console.log(`  UserProfile.id: ${carlos.UserProfile.id}`)
      console.log(`  UserProfile.role: ${carlos.UserProfile.role}`)
      console.log(`  UserProfile.avatar_url: ${carlos.UserProfile.avatar_url || 'NULL'}`)
      console.log(`  UserProfile.display_name: ${carlos.UserProfile.display_name || 'NULL'}`)
    } else {
      console.log(`\nTiene UserProfile: NO`)
    }
  } else {
    console.log('❌ Usuario no encontrado')
  }

  // ========== PARTE 4: ESQUEMA DE SUPABASE (REST API) ==========
  console.log('\n\n📊 PARTE 4: VERIFICAR ESQUEMA VÍA SUPABASE REST API\n')

  // Obtener un registro de user_profiles para ver columnas disponibles
  const { data: sampleProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (sampleProfile) {
    console.log('Columnas disponibles en user_profiles (Supabase REST):')
    console.log(Object.keys(sampleProfile).join(', '))
    console.log('')
  }

  // Obtener un registro de users para ver columnas disponibles
  const { data: sampleUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)
    .single()

  if (sampleUser) {
    console.log('Columnas disponibles en users (Supabase REST):')
    const columns = Object.keys(sampleUser)
    console.log(columns.join(', '))
    console.log('')

    // Verificar si tiene updated_at
    console.log(`¿Tiene 'updated_at'? ${columns.includes('updated_at') ? 'SÍ' : 'NO'}`)
    console.log(`¿Tiene 'updatedAt'? ${columns.includes('updatedAt') ? 'SÍ' : 'NO'}`)
  }

  // ========== PARTE 5: ANÁLISIS DE RUTAS Y ENDPOINTS ==========
  console.log('\n\n📊 PARTE 5: RESUMEN DE HALLAZGOS\n')
  console.log('─'.repeat(80))

  const inmobiliariasConProfile = allUsers.filter(u =>
    (u.user_type === 'inmobiliaria' || u.user_type === 'agency') &&
    allProfiles.some(p => p.userId === u.id)
  ).length

  const inmobiliariasSinProfile = allUsers.filter(u =>
    (u.user_type === 'inmobiliaria' || u.user_type === 'agency') &&
    !allProfiles.some(p => p.userId === u.id)
  ).length

  const inquilinosConProfile = allUsers.filter(u =>
    u.user_type === 'inquilino' &&
    allProfiles.some(p => p.userId === u.id)
  ).length

  const inquilinosSinProfile = allUsers.filter(u =>
    u.user_type === 'inquilino' &&
    !allProfiles.some(p => p.userId === u.id)
  ).length

  console.log('DISTRIBUCIÓN DE USUARIOS:')
  console.log(`  Inmobiliarias CON UserProfile: ${inmobiliariasConProfile}`)
  console.log(`  Inmobiliarias SIN UserProfile: ${inmobiliariasSinProfile}`)
  console.log(`  Inquilinos CON UserProfile: ${inquilinosConProfile}`)
  console.log(`  Inquilinos SIN UserProfile: ${inquilinosSinProfile}`)

  console.log('\n\nCONCLUSIONES:')
  console.log('1. ¿Todos los inquilinos tienen UserProfile?')
  console.log(`   ${inquilinosSinProfile === 0 ? '✅ SÍ' : '❌ NO - hay ' + inquilinosSinProfile + ' sin UserProfile'}`)

  console.log('\n2. ¿Las inmobiliarias pueden tener UserProfile?')
  console.log(`   ${inmobiliariasConProfile > 0 ? '✅ SÍ - ' + inmobiliariasConProfile + ' lo tienen (usuarios migrados)' : '❌ NO'}`)

  console.log('\n3. ¿Dónde se guarda el avatar para cada tipo?')
  console.log('   Inquilinos:')
  console.log('     - user_profiles.avatar_url (principal)')
  console.log('     - users.avatar (fallback)')
  console.log('   Inmobiliarias:')
  console.log('     - users.avatar (si NO tiene UserProfile)')
  console.log('     - user_profiles.avatar_url (si tiene UserProfile - migrados)')
  console.log('     - users.logo_url (logo de empresa)')

  await prisma.$disconnect()
}

auditCompleteSystem()
  .then(() => console.log('\n\n✅ Auditoría completada'))
  .catch(err => {
    console.error('\n\n❌ Error en auditoría:', err)
    process.exit(1)
  })
