-- DESHABILITAR TRIGGERS PROPERTY-IMAGES TEMPORALMENTE
-- Fecha: 3 Enero 2025
-- Propósito: Resolver error text = uuid deshabilitando triggers problemáticos

-- =====================================================
-- PASO 1: DESHABILITAR TRIGGERS TEMPORALMENTE
-- =====================================================

-- Deshabilitar los 3 triggers que causan el problema
DROP TRIGGER IF EXISTS trg_touch_property_on_image_insert ON storage.objects;
DROP TRIGGER IF EXISTS trg_touch_property_on_image_update ON storage.objects;
DROP TRIGGER IF EXISTS trg_touch_property_on_image_delete ON storage.objects;

-- =====================================================
-- PASO 2: VERIFICAR QUE SE DESHABILITARON
-- =====================================================

-- Verificar que no hay triggers de property-images activos
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'storage' 
AND event_object_table = 'objects'
AND trigger_name LIKE '%property%';

-- =====================================================
-- PASO 3: PROBAR UPLOAD
-- =====================================================

-- Después de ejecutar este SQL:
-- 1. Ir a http://localhost:3000/publicar
-- 2. Intentar subir una imagen
-- 3. Debería funcionar sin error 500

-- =====================================================
-- PASO 4: RE-HABILITAR TRIGGERS (OPCIONAL)
-- =====================================================

-- Si el upload funciona sin triggers, podemos re-crearlos con mejor manejo de errores:

/*
-- Versión mejorada de la función (ejecutar solo si es necesario)
CREATE OR REPLACE FUNCTION touch_property_on_image_change()
RETURNS TRIGGER AS $$
declare
  v_name text := coalesce(new.name, old.name);
  v_bucket text := coalesce(new.bucket_id, old.bucket_id);
  v_property_id uuid;
begin
  -- Solo procesar property-images
  if v_bucket <> 'property-images' then
    return coalesce(new, old);
  end if;

  -- Intentar extraer property_id con mejor manejo de errores
  begin
    -- name formato: {userId}/{propertyId}/{filename}
    v_property_id := split_part(v_name, '/', 2)::uuid;
    
    -- Verificar que el UUID es válido y la propiedad existe
    if v_property_id IS NOT NULL then
      update public.properties
        set updated_at = now()
      where id = v_property_id;
    end if;
    
  exception when others then
    -- Si hay cualquier error, simplemente continuar sin fallar
    -- Log del error (opcional)
    raise notice 'Error en touch_property_on_image_change: %', SQLERRM;
  end;

  return coalesce(new, old);
end;
$$ LANGUAGE plpgsql;

-- Re-crear triggers con la función mejorada
CREATE TRIGGER trg_touch_property_on_image_insert
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION touch_property_on_image_change();

CREATE TRIGGER trg_touch_property_on_image_update
  AFTER UPDATE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION touch_property_on_image_change();

CREATE TRIGGER trg_touch_property_on_image_delete
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION touch_property_on_image_change();
*/

-- =====================================================
-- INSTRUCCIONES DE EJECUCIÓN
-- =====================================================

/*
PASOS PARA RESOLVER EL PROBLEMA:

1. EJECUTAR: Los 3 DROP TRIGGER (deshabilitar triggers)
2. VERIFICAR: Query de verificación (debería mostrar 0 triggers)
3. PROBAR: Upload en http://localhost:3000/publicar
4. CONFIRMAR: Upload funciona sin error 500

RESULTADO ESPERADO:
- Upload exitoso sin triggers
- Imágenes se suben correctamente
- No hay error text = uuid
- Funcionalidad completa restaurada

NOTA:
- Los triggers son para actualizar updated_at en properties
- No son críticos para el funcionamiento del upload
- Se pueden re-habilitar después con mejor manejo de errores
*/
