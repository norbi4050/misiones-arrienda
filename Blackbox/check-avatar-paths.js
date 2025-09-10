const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAvatarPaths() {
  console.log('=== VERIFICACIÓN DE PATHS EN BASE DE DATOS ===');

  try {
    const { data, error } = await supabase
      .from('storage.objects')
      .select('id, bucket_id, name, created_at')
      .eq('bucket_id', 'avatars')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error al consultar base de datos:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️ No hay archivos en el bucket avatars');
      return;
    }

    console.log('📁 Últimos 5 archivos en bucket avatars:');
    data.forEach((item, index) => {
      const pathType = item.name.startsWith('avatars/') ? '❌ INCORRECTO' : '✅ CORRECTO';
      console.log(`${index + 1}. ${pathType} - ID: ${item.id}`);
      console.log(`   Name: ${item.name}`);
      console.log(`   Created: ${item.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkAvatarPaths();
