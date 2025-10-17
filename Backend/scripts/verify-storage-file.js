/**
 * Verificar si el archivo de avatar existe en Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('============================================================================');
  console.log('VERIFICACIÓN: Archivos en Supabase Storage');
  console.log('============================================================================\n');

  const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';

  // Test 1: Listar archivos en la carpeta del usuario
  console.log('1. Listando archivos en bucket avatars...\n');

  const { data: files, error: listError } = await supabase
    .storage
    .from('avatars')
    .list(userId);

  if (listError) {
    console.log(`❌ Error listando: ${listError.message}\n`);
  } else if (files && files.length > 0) {
    console.log(`✅ Encontrados ${files.length} archivos:\n`);
    files.forEach(file => {
      console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
    });
    console.log('');
  } else {
    console.log('⚠️ No hay archivos en esta carpeta\n');
  }

  // Test 2: Probar la URL específica que está fallando
  console.log('2. Probando URL específica que falla...\n');

  const problemUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co/storage/v1/object/public/avatars/6403f9d2-e846-4c70-87e0-e051127d9500/avatar/1758519463745-avatar.jpg';
  console.log(`URL del error 400:\n${problemUrl}\n`);

  // Extraer path del archivo
  const pathMatch = problemUrl.match(/\/avatars\/(.+)$/);
  if (pathMatch) {
    const filePath = pathMatch[1];
    console.log(`Path extraído: ${filePath}\n`);

    // Verificar si existe con download
    const { data: downloadData, error: downloadError } = await supabase
      .storage
      .from('avatars')
      .download(filePath);

    if (downloadError) {
      console.log(`❌ Error descargando: ${downloadError.message}`);
      console.log(`   Código: ${downloadError.status || 'N/A'}\n`);
    } else {
      console.log(`✅ Archivo existe y es descargable`);
      console.log(`   Tamaño: ${downloadData?.size || 0} bytes\n`);
    }
  }

  // Test 3: Generar URL pública correcta
  console.log('3. Generando URL pública correcta...\n');

  // Buscar el archivo correcto
  if (files && files.length > 0) {
    const avatarFile = files.find(f => f.name.includes('avatar'));
    if (avatarFile) {
      const correctPath = `${userId}/${avatarFile.name}`;
      const { data: publicUrl } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(correctPath);

      console.log(`✅ URL pública correcta:`);
      console.log(`   ${publicUrl.publicUrl}\n`);
    }
  }

  // Test 4: Verificar bucket company-logos para Cesar
  console.log('4. Verificando logo de Cesar (inmobiliaria)...\n');

  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b';

  const { data: logoFiles, error: logoError } = await supabase
    .storage
    .from('company-logos')
    .list(cesarId);

  if (logoError) {
    console.log(`❌ Error: ${logoError.message}\n`);
  } else if (logoFiles && logoFiles.length > 0) {
    console.log(`✅ Encontrados ${logoFiles.length} archivos:\n`);
    logoFiles.forEach(file => {
      const { data } = supabase.storage.from('company-logos').getPublicUrl(`${cesarId}/${file.name}`);
      console.log(`   - ${file.name}`);
      console.log(`     URL: ${data.publicUrl}\n`);
    });
  } else {
    console.log('⚠️ No hay logos\n');
  }
}

verify().catch(console.error);
