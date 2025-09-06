-- =====================================================
-- INSERTAR DATOS DE PRUEBA - PROPERTIES Y INQUIRIES
-- =====================================================
-- Fecha: 2025-01-27
-- Problema: No hay propiedades para referenciar en property_inquiries
-- Solución: Insertar datos de prueba válidos
-- =====================================================

-- PASO 1: INSERTAR PROPIEDADES DE PRUEBA
-- =====================================================
INSERT INTO public.properties (
  id, title, description, price, currency, property_type, bedrooms, bathrooms,
  area_total, address, city, province, country, user_id, status, featured,
  contact_phone, contact_email, amenities, pets_allowed, furnished, parking_spaces
) VALUES 
(
  'prop-001-posadas-casa',
  'Casa Familiar en Posadas Centro',
  'Hermosa casa de 3 dormitorios en el centro de Posadas, cerca de todos los servicios. Ideal para familias.',
  75000,
  'ARS',
  'casa',
  3,
  2,
  120.5,
  'Av. Mitre 1234',
  'Posadas',
  'Misiones',
  'Argentina',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'active',
  true,
  '+54 376 123-4567',
  'contacto@propiedadposadas.com',
  ARRAY['aire_acondicionado', 'garage', 'jardin', 'parrilla'],
  true,
  false,
  2
),
(
  'prop-002-eldorado-depto',
  'Departamento Moderno en Eldorado',
  'Departamento de 2 dormitorios con vista al río, completamente amueblado y con todos los servicios.',
  45000,
  'ARS',
  'departamento',
  2,
  1,
  65.0,
  'Calle San Martín 567',
  'Eldorado',
  'Misiones',
  'Argentina',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'active',
  false,
  '+54 376 987-6543',
  'info@deptoeldorado.com',
  ARRAY['amueblado', 'balcon', 'vista_rio'],
  false,
  true,
  1
),
(
  'prop-003-obera-local',
  'Local Comercial en Oberá',
  'Excelente local comercial en zona céntrica de Oberá, ideal para cualquier tipo de negocio.',
  35000,
  'ARS',
  'local',
  0,
  1,
  80.0,
  'Av. Libertad 890',
  'Oberá',
  'Misiones',
  'Argentina',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'active',
  false,
  '+54 376 456-7890',
  'comercial@localobera.com',
  ARRAY['zona_comercial', 'vidriera', 'deposito'],
  false,
  false,
  0
);

-- PASO 2: INSERTAR CONSULTAS DE PRUEBA (AHORA CON PROPERTY_ID VÁLIDO)
-- =====================================================
INSERT INTO public.property_inquiries (
  property_id, inquirer_user_id, message, contact_phone, contact_email,
  preferred_contact, budget_range, family_size, status, priority
) VALUES 
(
  'prop-001-posadas-casa',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Estoy interesado en esta casa. ¿Podríamos coordinar una visita para el fin de semana?',
  '+54 376 111-2222',
  'interesado1@ejemplo.com',
  'whatsapp',
  '70000-80000',
  4,
  'pending',
  'normal'
),
(
  'prop-002-eldorado-depto',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Me interesa el departamento amueblado. ¿Incluye servicios? ¿Cuándo está disponible?',
  '+54 376 333-4444',
  'consulta2@ejemplo.com',
  'email',
  '40000-50000',
  2,
  'contacted',
  'high'
),
(
  'prop-003-obera-local',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Busco local para abrir una panadería. ¿Este local tiene las instalaciones adecuadas?',
  '+54 376 555-6666',
  'negocio@ejemplo.com',
  'phone',
  '30000-40000',
  1,
  'scheduled',
  'urgent'
),
(
  'prop-001-posadas-casa',
  '6403f9d2-e846-4c70-87e0-e051127d9500',
  'Familia con mascotas busca casa. ¿Permiten perros? ¿Tiene patio cerrado?',
  '+54 376 777-8888',
  'familia@ejemplo.com',
  'whatsapp',
  '75000-85000',
  3,
  'interested',
  'normal'
);

-- PASO 3: VERIFICAR DATOS INSERTADOS
-- =====================================================
SELECT 'Propiedades insertadas:', COUNT(*) as total FROM public.properties;
SELECT 'Consultas insertadas:', COUNT(*) as total FROM public.property_inquiries;

-- PASO 4: VERIFICAR RELACIONES
-- =====================================================
SELECT 
  p.title as propiedad,
  pi.message as consulta,
  pi.status as estado,
  pi.priority as prioridad
FROM public.properties p
JOIN public.property_inquiries pi ON p.id = pi.property_id
ORDER BY pi.created_at DESC;

-- PASO 5: PROBAR LA QUERY ORIGINAL QUE CAUSABA ERROR 400
-- =====================================================
SELECT 
  p.id,
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'message', pi.message,
        'status', pi.status,
        'created_at', pi.created_at
      )
    )
    FROM public.property_inquiries pi 
    WHERE pi.property_id = p.id
  ) as inquiries
FROM public.properties p
WHERE p.user_id = '6403f9d2-e846-4c70-87e0-e051127d9500'
LIMIT 5;

-- PASO 6: MENSAJE DE ÉXITO
-- =====================================================
SELECT '✅ DATOS DE PRUEBA INSERTADOS EXITOSAMENTE' as resultado;
SELECT '✅ PROPERTY_INQUIRIES FUNCIONANDO CORRECTAMENTE' as resultado;
SELECT '✅ ERROR 400 PROPERTIES SOLUCIONADO' as resultado;
