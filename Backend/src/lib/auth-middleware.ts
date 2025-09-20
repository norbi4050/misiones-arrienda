import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createServerSupabase } from './supabase/server'

const prisma = new PrismaClient()

interface AuthenticatedUser {
  id: string
  name: string
  email: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Usar Supabase para obtener el usuario desde las cookies
    const supabase = await createServerSupabase()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      console.error('Supabase auth error:', error)
      return null
    }

    // Buscar el usuario en la base de datos usando el ID de Supabase
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Si el usuario no existe en Prisma, crearlo automáticamente
    if (!dbUser) {
      console.log('User not found in database, creating automatically:', user.id)
      
      try {
        // Extraer información del usuario de Supabase
        const userName = user.user_metadata?.name || 
                        user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Usuario'
        
        // Crear el usuario en Prisma
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            name: userName,
            email: user.email!,
            phone: '', // Campo requerido, valor por defecto
            emailVerified: !!user.email_confirmed_at // Boolean: true si está confirmado
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        })

        console.log('User created successfully in database:', {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email
        })
      } catch (createError: any) {
        console.error('Error creating user in database:', createError)
        
        // Si hay error de constraint único (usuario ya existe), intentar buscarlo de nuevo
        if (createError instanceof Error && createError.message.includes('Unique constraint')) {
          console.log('User might have been created by another request, trying to find again...')
          dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              id: true,
              name: true,
              email: true
            }
          })
        }
        
        if (!dbUser) {
          console.error('Failed to create or find user after creation attempt')
          return null
        }
      }
    }

    return dbUser
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Función alternativa que busca por email si el token contiene un email
export async function getAuthenticatedUserByEmail(email: string): Promise<AuthenticatedUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    return user
  } catch (error) {
    console.error('Error in getAuthenticatedUserByEmail:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Función para obtener usuario por token de localStorage (compatibilidad con sistema actual)
export async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    // El token puede ser el userId directamente o un email
    let user = null

    // Primero intentamos como userId
    user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Si no se encuentra, intentamos como email
    if (!user && token.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: token },
        select: {
          id: true,
          name: true,
          email: true
        }
      })
    }

    return user
  } catch (error) {
    console.error('Error in getUserFromToken:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}
