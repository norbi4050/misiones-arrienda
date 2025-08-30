
// Script de testing para ejecutar en el navegador
console.log('🧪 INICIANDO TESTING DEL FORMULARIO DE PUBLICAR');

// Función para llenar el formulario
function llenarFormulario() {
    console.log('📝 Llenando formulario de prueba...');
    
    // Datos de prueba
    const datosTest = {
        title: 'Casa de Prueba Testing',
        description: 'Esta es una propiedad de prueba para verificar el funcionamiento del formulario',
        price: '150000',
        type: 'HOUSE',
        bedrooms: '3',
        bathrooms: '2',
        area: '120',
        address: 'Av. Test 123',
        city: 'Posadas',
        contact_phone: '+54 376 123456'
    };
    
    // Llenar campos
    Object.keys(datosTest).forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"], #${campo}`);
        if (elemento) {
            elemento.value = datosTest[campo];
            elemento.dispatchEvent(new Event('input', { bubbles: true }));
            elemento.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Campo ${campo} llenado`);
        } else {
            console.log(`❌ Campo ${campo} no encontrado`);
        }
    });
}

// Función para verificar validación
function verificarValidacion() {
    console.log('🔍 Verificando validación...');
    
    const camposRequeridos = ['title', 'description', 'price', 'contact_phone'];
    let errores = 0;
    
    camposRequeridos.forEach(campo => {
        const elemento = document.querySelector(`[name="${campo}"], #${campo}`);
        if (elemento) {
            // Limpiar campo
            elemento.value = '';
            elemento.dispatchEvent(new Event('blur', { bubbles: true }));
            
            // Verificar si aparece error
            setTimeout(() => {
                const errorElement = document.querySelector(`[data-error="${campo}"], .text-red-500`);
                if (errorElement && errorElement.textContent.trim()) {
                    console.log(`✅ Validación de ${campo} funciona`);
                } else {
                    console.log(`❌ Validación de ${campo} no funciona`);
                    errores++;
                }
            }, 100);
        }
    });
    
    return errores;
}

// Función para probar envío
function probarEnvio() {
    console.log('📤 Probando envío del formulario...');
    
    // Llenar formulario primero
    llenarFormulario();
    
    setTimeout(() => {
        const submitButton = document.querySelector('button[type="submit"], .btn-submit');
        if (submitButton) {
            console.log('🔘 Botón de envío encontrado, simulando click...');
            submitButton.click();
        } else {
            console.log('❌ Botón de envío no encontrado');
        }
    }, 1000);
}

// Ejecutar tests
console.log('🚀 Ejecutando tests automáticos...');
setTimeout(() => {
    llenarFormulario();
    setTimeout(() => {
        verificarValidacion();
        setTimeout(() => {
            probarEnvio();
        }, 2000);
    }, 1000);
}, 1000);
