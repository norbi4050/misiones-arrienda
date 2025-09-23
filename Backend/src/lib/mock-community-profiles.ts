// Mock data compartido para perfiles de comunidad
// Este archivo centraliza el almacenamiento con persistencia en archivo JSON

import fs from 'fs'
import path from 'path'

export interface MockProfile {
  id: string
  role: 'BUSCO' | 'OFREZCO'
  city: string
  neighborhood: string
  budgetMin: number
  budgetMax: number
  bio: string
  age: number
  petPref: string
  smokePref: string
  diet: string
  scheduleNotes: string
  tags: string[]
  photos: string[]
  acceptsMessages: boolean
  user: {
    id: string
    name: string
    avatar: string
    rating: number
    reviewCount: number
  }
  _count: {
    likesReceived: number
  }
  createdAt: Date | string
}

// Ruta del archivo de persistencia
const PROFILES_FILE = path.join(process.cwd(), 'data', 'community-profiles.json')

// Datos iniciales por defecto - LIMPIO SIN DEMOS
const defaultProfiles: MockProfile[] = []

// Funciones de persistencia
function ensureDataDirectory(): void {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

function loadProfilesFromFile(): MockProfile[] {
  try {
    ensureDataDirectory()
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf8')
      const profiles = JSON.parse(data)
      // Convertir strings de fecha de vuelta a Date objects
      return profiles.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      }))
    }
  } catch (error) {
    console.error('Error loading profiles from file:', error)
  }
  return defaultProfiles
}

function saveProfilesToFile(profiles: MockProfile[]): void {
  try {
    ensureDataDirectory()
    // Convertir Date objects a strings para JSON
    const serializable = profiles.map(p => ({
      ...p,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt
    }))
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(serializable, null, 2))
  } catch (error) {
    console.error('Error saving profiles to file:', error)
  }
}

// Cache en memoria para mejor rendimiento
let cachedProfiles: MockProfile[] | null = null

function getProfiles(): MockProfile[] {
  if (!cachedProfiles) {
    cachedProfiles = loadProfilesFromFile()
  }
  return cachedProfiles
}

// Funciones helper para manipular el mock data con persistencia
export function addProfile(profile: MockProfile): void {
  const profiles = getProfiles()
  profiles.push(profile)
  cachedProfiles = profiles
  saveProfilesToFile(profiles)
}

export function findProfileById(id: string): MockProfile | undefined {
  const profiles = getProfiles()
  return profiles.find(p => p.id === id)
}

export function getAllProfiles(): MockProfile[] {
  return getProfiles()
}

export function getNextId(): string {
  const profiles = getProfiles()
  return (profiles.length + 1).toString()
}

// Función para actualizar un perfil existente
export function updateProfile(userId: string, updatedProfile: MockProfile): boolean {
  const profiles = getProfiles()
  const index = profiles.findIndex(p => p.user.id === userId)
  
  if (index === -1) {
    return false
  }
  
  profiles[index] = updatedProfile
  cachedProfiles = profiles
  saveProfilesToFile(profiles)
  return true
}

// Función para reinicializar con datos por defecto (útil para testing)
export function resetToDefaults(): void {
  cachedProfiles = [...defaultProfiles]
  saveProfilesToFile(cachedProfiles)
}
