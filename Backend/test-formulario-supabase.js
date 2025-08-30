
// Script de testing para formulario con Supabase
// Ejecutar en la consola del navegador en http://localhost:3000/publicar

console.log('🧪 INICIANDO TESTING FORMULARIO CON SUPABASE');

// Función para probar la conexión con Supabase
async function testSupabaseConnection() {
    try {
        // Verificar que Supabase esté disponible
        if (typeof window !== 'undefined' && window.supabase) {
            console.log('✅ Cliente Supabase disponible');
            
            // Probar consulta simple
            const { data, error } = await window.supabase
                .from('Property')
                .select('id, title, contact_phone')
                .limit(1);
                
            if (error) {
                console.log('❌ Error en consulta Supabase:', error);
            } else {
                console.log('✅ Consulta Supabase exitosa:', data);
            }
        } else {
            console.log('❌ Cliente Supabase no disponible');
        }
    } catch (error) {
        console.log('❌ Error testing Supabase:', error);
    }
}

// Función para llenar y enviar el formulario
async function testFormularioCompleto() {
    console.log('📝 Llenando formulario de prueba...');
    
    const datosTest = {
        title: 'Propiedad Test Supabase ' + Date.now(),
        description: 'Esta es una propiedad de prueba para verificar la integración con Supabase',
        price: '175000',
        currency: 'ARS',
        type: 'HOUSE',
        bedrooms: '3',
        bathrooms: '2',
        area: '130',
        address: 'Av. Supabase Test 456',
        city: 'Posadas',
        contact_phone: '+54 376 987654'
    };
    
    // Llenar campos del formulario
    Object.keys(datosTest).forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"], #${campo}`);
        if (elemento) {
            elemento.value = datosTest[campo];
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Campo ${campo}: ${datosTest[campo]}`);
        } else {
            console.log(`❌ Campo ${campo} no encontrado`);
        }
    });
    
    // Esperar un momento para que React procese los cambios
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar que contact_phone esté presente
    const contactPhoneField = document.querySelector('[name="contact_phone"], #contact_phone');
    if (contactPhoneField && contactPhoneField.value) {
        console.log('✅ Campo contact_phone presente y con valor:', contactPhoneField.value);
    } else {
        console.log('❌ Campo contact_phone no encontrado o sin valor');
    }
    
    // Intentar enviar el formulario
    const submitButton = document.querySelector('button[type="submit"], .btn-submit');
    if (submitButton) {
        console.log('🚀 Enviando formulario...');
        submitButton.click();
        
        // Esperar respuesta
        setTimeout(() => {
            console.log('📊 Verificar en la consola de red si la petición fue exitosa');
            console.log('📊 Verificar en Supabase Dashboard si se creó el registro');
        }, 2000);
    } else {
        console.log('❌ Botón de envío no encontrado');
    }
}

// Ejecutar tests
console.log('🚀 Iniciando tests automáticos...');
testSupabaseConnection().then(() => {
    setTimeout(() => {
        testFormularioCompleto();
    }, 1000);
});
