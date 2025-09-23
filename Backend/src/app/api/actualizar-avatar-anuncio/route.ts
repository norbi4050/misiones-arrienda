import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, updateProfile } from '@/lib/mock-community-profiles'

export async function POST(request: NextRequest) {
  try {
    // Obtener todos los perfiles
    const profiles = getAllProfiles()
    
    // Buscar el anuncio del usuario específico
    const userId = '6403f9d2-e846-4c70-87e0-e051127d9500'
    const userProfile = profiles.find(p => p.user.id === userId)

    if (!userProfile) {
      return NextResponse.json({ error: "No se encontró anuncio del usuario" }, { status: 404 })
    }

    // Avatar generado automáticamente desde Supabase
    const newAvatar = 'https://ui-avatars.com/api/?name=Carlos+Norberto&background=0D8ABC&color=fff&size=200'

    console.log('Avatar actual del anuncio:', userProfile.user.avatar)
    console.log('Nuevo avatar a aplicar:', newAvatar)

    // Actualizar anuncio con el nuevo avatar
    const updatedProfile = {
      ...userProfile,
      user: {
        ...userProfile.user,
        avatar: newAvatar
      }
    }

    // Guardar cambios
    const success = updateProfile(userId, updatedProfile)

    if (success) {
      console.log('✅ Avatar del anuncio actualizado con avatar generado automáticamente')
      
      return NextResponse.json({
        success: true,
        message: "Avatar del anuncio actualizado correctamente",
        before: userProfile.user.avatar,
        after: newAvatar,
        userId: userId,
        userName: userProfile.user.name
      })
    } else {
      return NextResponse.json({ error: "Error actualizando anuncio" }, { status: 500 })
    }

  } catch (error) {
    console.error('Error actualizando avatar del anuncio:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
