import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, propertyIds, data } = body;

    if (!action || !propertyIds || !Array.isArray(propertyIds)) {
      return NextResponse.json({
        error: 'Faltan parámetros requeridos: action, propertyIds'
      }, { status: 400 });
    }

    if (propertyIds.length === 0) {
      return NextResponse.json({
        error: 'Debe seleccionar al menos una propiedad'
      }, { status: 400 });
    }

    // Verificar que el usuario es propietario de todas las propiedades
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, user_id, title, status')
      .in('id', propertyIds);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json({ error: 'Error al verificar propiedades' }, { status: 500 });
    }

    // Verificar permisos
    const unauthorizedProperties = properties?.filter(p => p.user_id !== user.id) || [];
    if (unauthorizedProperties.length > 0) {
      return NextResponse.json({
        error: 'No tienes permisos para modificar algunas propiedades seleccionadas'
      }, { status: 403 });
    }

    const validPropertyIds = properties?.map(p => p.id) || [];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      processed: [] as any[]
    };

    switch (action) {
      case 'delete':
        try {
          const { error: deleteError } = await supabase
            .from('properties')
            .delete()
            .in('id', validPropertyIds);

          if (deleteError) {
            console.error('Error deleting properties:', deleteError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al eliminar propiedades');
          } else {
            results.success = validPropertyIds.length;
            results.processed = validPropertyIds.map(id => ({
              id,
              action: 'deleted',
              status: 'success'
            }));
          }
        } catch (error) {
          console.error('Delete operation failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al eliminar propiedades');
        }
        break;

      case 'update-status':
        const newStatus = data?.status;
        if (!newStatus) {
          return NextResponse.json({
            error: 'Estado requerido para actualización'
          }, { status: 400 });
        }

        const validStatuses = ['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED'];
        if (!validStatuses.includes(newStatus)) {
          return NextResponse.json({
            error: 'Estado no válido'
          }, { status: 400 });
        }

        try {
          const { error: updateError } = await supabase
            .from('properties')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .in('id', validPropertyIds);

          if (updateError) {
            console.error('Error updating status:', updateError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al actualizar estado');
          } else {
            results.success = validPropertyIds.length;
            results.processed = validPropertyIds.map(id => ({
              id,
              action: 'status_updated',
              status: 'success',
              newStatus
            }));
          }
        } catch (error) {
          console.error('Status update failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al actualizar estado');
        }
        break;

      case 'toggle-featured':
        try {
          // Obtener estado actual de is_featured para cada propiedad
          const { data: currentProperties, error: fetchError } = await supabase
            .from('properties')
            .select('id, is_featured')
            .in('id', validPropertyIds);

          if (fetchError) {
            console.error('Error fetching current featured status:', fetchError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al obtener estado actual');
            break;
          }

          // Procesar cada propiedad individualmente
          for (const property of currentProperties || []) {
            const newFeaturedStatus = !property.is_featured;

            const { error: updateError } = await supabase
              .from('properties')
              .update({
                is_featured: newFeaturedStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', property.id);

            if (updateError) {
              console.error(`Error updating featured status for ${property.id}:`, updateError);
              results.failed++;
              results.errors.push(`Error al actualizar propiedad ${property.id}`);
            } else {
              results.success++;
              results.processed.push({
                id: property.id,
                action: 'featured_toggled',
                status: 'success',
                newFeaturedStatus
              });
            }
          }
        } catch (error) {
          console.error('Featured toggle failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al cambiar estado destacado');
        }
        break;

      case 'archive':
        try {
          const { error: archiveError } = await supabase
            .from('properties')
            .update({
              status: 'EXPIRED',
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .in('id', validPropertyIds);

          if (archiveError) {
            console.error('Error archiving properties:', archiveError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al archivar propiedades');
          } else {
            results.success = validPropertyIds.length;
            results.processed = validPropertyIds.map(id => ({
              id,
              action: 'archived',
              status: 'success'
            }));
          }
        } catch (error) {
          console.error('Archive operation failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al archivar propiedades');
        }
        break;

      case 'export':
        try {
          // Obtener datos completos de las propiedades para exportar
          const { data: exportProperties, error: exportError } = await supabase
            .from('properties')
            .select('*')
            .in('id', validPropertyIds);

          if (exportError) {
            console.error('Error fetching properties for export:', exportError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al obtener datos para exportar');
          } else {
            results.success = validPropertyIds.length;
            results.processed = [{
              action: 'exported',
              status: 'success',
              data: exportProperties,
              format: 'json',
              timestamp: new Date().toISOString()
            }];
          }
        } catch (error) {
          console.error('Export operation failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al exportar propiedades');
        }
        break;

      case 'duplicate':
        try {
          const { data: originalProperties, error: fetchError } = await supabase
            .from('properties')
            .select('*')
            .in('id', validPropertyIds);

          if (fetchError) {
            console.error('Error fetching properties to duplicate:', fetchError);
            results.failed = validPropertyIds.length;
            results.errors.push('Error al obtener propiedades originales');
            break;
          }

          const duplicatedProperties = [];

          for (const original of originalProperties || []) {
            // Crear copia sin id, created_at, updated_at
            const { id, created_at, updated_at, ...propertyData } = original;

            const duplicatedProperty = {
              ...propertyData,
              title: `${original.title} (Copia)`,
              is_featured: false, // Las copias no son destacadas por defecto
              status: 'AVAILABLE', // Estado por defecto para copias
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newProperty, error: insertError } = await supabase
              .from('properties')
              .insert([duplicatedProperty])
              .select()
              .single();

            if (insertError) {
              console.error(`Error duplicating property ${original.id}:`, insertError);
              results.failed++;
              results.errors.push(`Error al duplicar propiedad ${original.title}`);
            } else {
              results.success++;
              duplicatedProperties.push(newProperty);
              results.processed.push({
                originalId: original.id,
                newId: newProperty.id,
                action: 'duplicated',
                status: 'success'
              });
            }
          }
        } catch (error) {
          console.error('Duplicate operation failed:', error);
          results.failed = validPropertyIds.length;
          results.errors.push('Error interno al duplicar propiedades');
        }
        break;

      default:
        return NextResponse.json({
          error: 'Acción no válida'
        }, { status: 400 });
    }

    // Registrar actividad (opcional - para auditoría)
    try {
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: `bulk_${action}`,
          details: {
            propertyIds: validPropertyIds,
            results,
            timestamp: new Date().toISOString()
          }
        }]);
    } catch (logError) {
      // No fallar si no se puede registrar la actividad
      }

    return NextResponse.json({
      success: true,
      message: `Operación completada: ${results.success} exitosas, ${results.failed} fallidas`,
      results,
      summary: {
        total: validPropertyIds.length,
        successful: results.success,
        failed: results.failed,
        action
      }
    });

  } catch (error) {
    console.error('Error in bulk properties API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Obtener información sobre operaciones en lote disponibles
    const bulkOperations = {
      available_actions: [
        {
          type: 'delete',
          label: 'Eliminar',
          description: 'Eliminar propiedades seleccionadas permanentemente',
          requires_confirmation: true,
          icon: 'trash'
        },
        {
          type: 'update-status',
          label: 'Cambiar Estado',
          description: 'Actualizar el estado de las propiedades seleccionadas',
          requires_data: ['status'],
          available_statuses: ['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED'],
          icon: 'edit'
        },
        {
          type: 'toggle-featured',
          label: 'Destacar/Quitar',
          description: 'Alternar el estado destacado de las propiedades',
          icon: 'star'
        },
        {
          type: 'archive',
          label: 'Archivar',
          description: 'Archivar propiedades (cambiar a expirado e inactivo)',
          requires_confirmation: true,
          icon: 'archive'
        },
        {
          type: 'export',
          label: 'Exportar',
          description: 'Exportar datos de las propiedades seleccionadas',
          formats: ['json', 'csv'],
          icon: 'download'
        },
        {
          type: 'duplicate',
          label: 'Duplicar',
          description: 'Crear copias de las propiedades seleccionadas',
          requires_confirmation: true,
          icon: 'copy'
        }
      ],
      limits: {
        max_properties_per_operation: 100,
        max_operations_per_hour: 50
      },
      user_stats: {
        total_properties: 0,
        operations_today: 0,
        last_operation: null
      }
    };

    // Obtener estadísticas del usuario
    const { data: userProperties, error: propertiesError } = await supabase
      .from('properties')
      .select('id')
      .eq('user_id', user.id);

    if (!propertiesError && userProperties) {
      bulkOperations.user_stats.total_properties = userProperties.length;
    }

    // Si se solicita información específica de una acción
    if (action) {
      const actionInfo = bulkOperations.available_actions.find(a => a.type === action);
      if (actionInfo) {
        return NextResponse.json({
          action: actionInfo,
          user_stats: bulkOperations.user_stats
        });
      } else {
        return NextResponse.json({ error: 'Acción no encontrada' }, { status: 404 });
      }
    }

    return NextResponse.json(bulkOperations);

  } catch (error) {
    console.error('Error in bulk properties GET API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
