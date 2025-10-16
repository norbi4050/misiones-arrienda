export type CommunityRole = 'BUSCO' | 'OFREZCO'
export type PetPreference = 'SI_PET' | 'NO_PET' | 'INDIFERENTE'
export type SmokePreference = 'FUMADOR' | 'NO_FUMADOR' | 'INDIFERENTE'
export type DietType = 'NINGUNA' | 'VEGETARIANO' | 'VEGANO' | 'CELIACO' | 'OTRO'
export type RoomType = 'PRIVADA' | 'COMPARTIDA' | 'ESTUDIO' | 'CASA_COMPLETA'
export type SortType = 'recent' | 'highlight'

export interface CommunityPost {
  id: string
  user_id: string
  role: CommunityRole
  title: string
  description: string
  city: string
  neighborhood?: string
  price?: number
  budget_min?: number
  budget_max?: number
  available_from?: string
  lease_term?: string
  room_type: RoomType
  occupants?: number
  pet_pref: PetPreference
  smoke_pref: SmokePreference
  diet: DietType
  amenities: string[]
  tags: string[]
  images: string[]
  is_active: boolean
  status?: string
  expires_at?: string
  views_count?: number
  created_at: string
  updated_at: string
  author_photo?: string
  author_name?: string
}

export interface CommunityPostsResponse {
  posts: CommunityPost[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface CreateCommunityPostRequest {
  role: CommunityRole
  title: string
  description: string
  city: string
  neighborhood?: string
  price?: number
  budgetMin?: number
  budgetMax?: number
  availableFrom?: string
  leaseTerm?: string
  roomType: RoomType
  occupants?: number
  petPref: PetPreference
  smokePref: SmokePreference
  diet: DietType
  amenities: string[]
  tags: string[]
  images: string[]
}
