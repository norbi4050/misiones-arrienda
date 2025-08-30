
// Script de testing automático del formulario
// Ejecutar en la consola del navegador en http://localhost:3000/publicar

console.log('🧪 INICIANDO TESTING AUTOMÁTICO DEL FORMULARIO');
console.log('==============================================');

async function testFormularioCompleto() {
    console.log('📝 Fase 1: Verificando elementos del formulario...');
    
    const campos = [
        'title',
        'description', 
        'price',
        'bedrooms',
        'bathrooms',
        'address',
        'city',
        'contact_phone'
    ];
    
    let camposEncontrados = 0;
    
    campos.forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"], #${campo}, input[placeholder*="${campo}"], input[placeholder*="teléfono"], input[placeholder*="contacto"]`);
        if (elemento) {
            console.log(`✅ Campo ${campo} encontrado`);
            camposEncontrados++;
        } else {
            console.log(`❌ Campo ${campo} NO encontrado`);
        }
    });
    
    console.log(`📊 Campos encontrados: ${camposEncontrados}/${campos.length}`);
    
    if (camposEncontrados < campos.length) {
        console.log('⚠️  Algunos campos están faltantes. Verificar el formulario.');
        return false;
    }
    
    console.log('📝 Fase 2: Llenando formulario con datos de prueba...');
    
    const datosTest = {
        title: 'Casa Test QA Supabase ' + Date.now(),
        description: 'Esta es una propiedad de prueba para verificar la integración completa con Supabase y el funcionamiento del campo contact_phone.',
        price: '185000',
        bedrooms: '3',
        bathrooms: '2', 
        address: 'Av. Testing QA 789',
        city: 'Posadas',
        contact_phone: '+54 376 444555'
    };
    
    let camposLlenados = 0;
    
    Object.keys(datosTest).forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"], #${campo}, input[placeholder*="${campo}"], input[placeholder*="teléfono"], input[placeholder*="contacto"]`);
        if (elemento) {
            elemento.value = datosTest[campo];
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Campo ${campo} llenado: ${datosTest[campo]}`);
            camposLlenados++;
        } else {
            console.log(`❌ No se pudo llenar el campo ${campo}`);
        }
    });
    
    console.log(`📊 Campos llenados: ${camposLlenados}/${Object.keys(datosTest).length}`);
    
    // Esperar un momento para que React procese
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Fase 3: Verificando validación...');
    
    // Buscar errores de validación
    const errores = document.querySelectorAll('.error, .text-red-500, .text-danger, [class*="error"]');
    if (errores.length > 0) {
        console.log(`⚠️  Se encontraron ${errores.length} errores de validación:`);
        errores.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.textContent}`);
        });
    } else {
        console.log('✅ No se encontraron errores de validación');
    }
    
    console.log('📝 Fase 4: Intentando enviar formulario...');
    
    const submitButton = document.querySelector('button[type="submit"], .btn-submit, button:contains("Publicar"), button:contains("Enviar")');
    if (submitButton) {
        console.log('🚀 Enviando formulario...');
        submitButton.click();
        
        // Esperar respuesta
        setTimeout(() => {
            console.log('📊 RESULTADOS DEL TESTING:');
            console.log('==========================');
            console.log('1. Verificar en la pestaña Network si la petición fue exitosa');
            console.log('2. Verificar en Supabase Dashboard si se creó el registro');
            console.log('3. Confirmar que contact_phone se guardó correctamente');
            console.log('');
            console.log('🔗 Enlaces importantes:');
            console.log('📊 Supabase Dashboard: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele');
            console.log('📊 Table Editor: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele/editor');
        }, 3000);
        
        return true;
    } else {
        console.log('❌ Botón de envío no encontrado');
        return false;
    }
}

// Ejecutar el test
testFormularioCompleto().then(resultado => {
    if (resultado) {
        console.log('🎉 TESTING DEL FORMULARIO COMPLETADO');
    } else {
        console.log('❌ TESTING DEL FORMULARIO FALLÓ');
    }
});
