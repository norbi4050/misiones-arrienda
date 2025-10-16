/**
 * Adaptador de Base de Datos - Permite alternar entre Prisma y Supabase
 * Creado para resolver problemas de conectividad Prisma ↔ Supabase
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Configuración: usar Supabase por defecto para operaciones críticas
const USE_SUPABASE_FOR_PROPERTIES = true
const USE_SUPABASE_FOR_CRITICAL_OPS = true

export class DatabaseAdapter {
  
  /**
   * Crear propiedad usando el método más estable disponible
   */
  static async createProperty(data: any) {
    if (USE_SUPABASE_FOR_PROPERTIES) {
      const supabase = await createClient()
      
      const { data: property, error } = await supabase
        .from('properties')
        .insert({
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || 'ARS',
          propertyType: data.propertyType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          garages: data.garages || 0,
          area: data.area,
          address: data.address,
          city: data.city,
          province: data.province || 'Misiones',
          postalCode: data.postalCode || '3300',
          status: data.status || 'AVAILABLE',
          images: JSON.stringify(data.images || []),
          amenities: JSON.stringify(data.amenities || []),
          features: JSON.stringify(data.features || []),
          contact_phone: data.contact_phone,
          contact_name: data.contact_name,
          userId: data.userId,
          featured: data.featured || false,
          isActive: data.isActive !== false,
          isPaid: data.isPaid || false
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      return property
    } else {
      // Fallback a Prisma si está disponible
      return await prisma.property.create({ data })
    }
  }

  /**
   * Actualizar propiedad
   */
  static async updateProperty(id: string, data: any) {
    if (USE_SUPABASE_FOR_PROPERTIES) {
      const supabase = await createClient()
      
      const { data: property, error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      return property
    } else {
      return await prisma.property.update({ where: { id }, data })
    }
  }

  /**
   * Crear suscripción
   */
  static async createSubscription(data: any) {
    if (USE_SUPABASE_FOR_CRITICAL_OPS) {
      const supabase = await createClient()
      
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert(data)
        .select()
        .single()

      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }

      return subscription
    } else {
      return await prisma.subscription.create({ data })
    }
  }

  /**
   * Verificar conectividad de ambos sistemas
   */
  static async healthCheck() {
    const results: {
      supabase: { status: string; error: string | null }
      prisma: { status: string; error: string | null }
    } = {
      supabase: { status: 'unknown', error: null },
      prisma: { status: 'unknown', error: null }
    }

    // Test Supabase
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('properties').select('id').limit(1)
      
      if (error) {
        results.supabase = { status: 'error', error: error.message }
      } else {
        results.supabase = { status: 'ok', error: null }
      }
    } catch (error) {
      results.supabase = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }

    // Test Prisma
    try {
      await prisma.property.findFirst({ select: { id: true } })
      results.prisma = { status: 'ok', error: null }
    } catch (error) {
      results.prisma = { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
    }

    return results
  }
}

export default DatabaseAdapter
