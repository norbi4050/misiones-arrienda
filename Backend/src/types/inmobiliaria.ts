/**
 * TIPOS TYPESCRIPT: PERFILES PÚBLICOS DE INMOBILIARIAS
 * Fecha: Enero 2025
 * 
 * Define todas las interfaces y tipos necesarios para el sistema completo
 * de perfiles públicos de inmobiliarias.
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Horario de un día específico
 */
export interface DaySchedule {
  open: string;      // Formato: "HH:MM" (ej: "09:00")
  close: string;     // Formato: "HH:MM" (ej: "18:00")
  closed: boolean;   // true si está cerrado todo el día
}

/**
 * Horarios de atención completos (7 días)
 */
export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Miembro del equipo de la inmobiliaria
 */
export interface TeamMember {
  id: string;
  agency_id: string;
  name: string;
  photo_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Estadísticas públicas de la inmobiliaria
 */
export interface AgencyStats {
  total_properties: number;        // Total de propiedades
  active_properties: number;       // Propiedades activas
  average_price: number;           // Precio promedio
  properties_this_month: number;   // Propiedades publicadas este mes
}

/**
 * Ubicación geográfica
 */
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Configuración de privacidad del perfil público
 */
export interface PrivacySettings {
  show_team_public: boolean;
  show_hours_public: boolean;
  show_map_public: boolean;
  show_stats_public: boolean;
  show_phone_public: boolean;
  show_address_public: boolean;
}

// ============================================================================
// PERFIL COMPLETO DE INMOBILIARIA
// ============================================================================

/**
 * Perfil público completo de una inmobiliaria
 * Incluye toda la información visible en /inmobiliaria/[id]
 */
export interface InmobiliariaProfile {
  // Información básica
  id: string;
  company_name: string;
  logo_url: string | null;
  verified: boolean;
  description: string | null;
  created_at: string;
  
  // Contacto
  commercial_phone: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  website: string | null;
  
  // Redes sociales
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  
  // Horarios de atención
  business_hours: BusinessHours | null;
  timezone: string;
  
  // Ubicación
  latitude: number | null;
  longitude: number | null;
  
  // Configuración de privacidad
  show_team_public: boolean;
  show_hours_public: boolean;
  show_map_public: boolean;
  show_stats_public: boolean;
  show_phone_public: boolean;
  show_address_public: boolean;
}

/**
 * Perfil de inmobiliaria con datos relacionados
 * Usado en el componente cliente del perfil público
 */
export interface InmobiliariaProfileWithRelations extends InmobiliariaProfile {
  team_members?: TeamMember[];
  stats?: AgencyStats;
  properties_count?: number;
}

// ============================================================================
// FORMULARIOS Y EDICIÓN
// ============================================================================

/**
 * Datos para crear/actualizar un miembro del equipo
 */
export interface TeamMemberFormData {
  name: string;
  photo_url?: string | null;
  display_order?: number;
}

/**
 * Datos para actualizar el perfil de la inmobiliaria
 */
export interface UpdateInmobiliariaProfileData {
  company_name?: string;
  description?: string;
  commercial_phone?: string;
  address?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  business_hours?: BusinessHours;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  show_team_public?: boolean;
  show_hours_public?: boolean;
  show_map_public?: boolean;
  show_stats_public?: boolean;
  show_phone_public?: boolean;
  show_address_public?: boolean;
}

// ============================================================================
// RESPUESTAS DE API
// ============================================================================

/**
 * Respuesta de la API de estadísticas
 */
export interface AgencyStatsResponse {
  success: boolean;
  stats: AgencyStats;
  timestamp: string;
}

/**
 * Respuesta de la API de equipo (GET)
 */
export interface TeamMembersResponse {
  success: boolean;
  team_members: TeamMember[];
  count: number;
}

/**
 * Respuesta de la API de perfil (GET)
 */
export interface InmobiliariaProfileResponse {
  success: boolean;
  profile: InmobiliariaProfile;
}

/**
 * Respuesta genérica de éxito
 */
export interface SuccessResponse {
  success: boolean;
  message: string;
}

/**
 * Respuesta genérica de error
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}

// ============================================================================
// HELPERS Y UTILIDADES
// ============================================================================

/**
 * Estado de "Abierto ahora"
 */
export interface OpenNowStatus {
  is_open: boolean;
  current_day: string;
  current_time: string;
  next_opening?: {
    day: string;
    time: string;
  };
}

/**
 * Validación de horarios
 */
export interface BusinessHoursValidation {
  is_valid: boolean;
  errors: string[];
}

/**
 * Props para componentes de horarios
 */
export interface BusinessHoursProps {
  hours: BusinessHours;
  timezone: string;
  className?: string;
}

/**
 * Props para componentes de equipo
 */
export interface TeamMemberCardProps {
  member: TeamMember;
  className?: string;
}

/**
 * Props para componentes de estadísticas
 */
export interface AgencyStatsProps {
  stats: AgencyStats;
  loading?: boolean;
  className?: string;
}

/**
 * Props para componente de mapa
 */
export interface AgencyLocationMapProps {
  location: Location;
  companyName: string;
  className?: string;
}

// ============================================================================
// CONSTANTES Y ENUMS
// ============================================================================

/**
 * Días de la semana
 */
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * Nombres de días en español
 */
export const DAY_NAMES_ES: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lunes',
  [DayOfWeek.TUESDAY]: 'Martes',
  [DayOfWeek.WEDNESDAY]: 'Miércoles',
  [DayOfWeek.THURSDAY]: 'Jueves',
  [DayOfWeek.FRIDAY]: 'Viernes',
  [DayOfWeek.SATURDAY]: 'Sábado',
  [DayOfWeek.SUNDAY]: 'Domingo',
};

/**
 * Nombres de días abreviados
 */
export const DAY_NAMES_SHORT_ES: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lun',
  [DayOfWeek.TUESDAY]: 'Mar',
  [DayOfWeek.WEDNESDAY]: 'Mié',
  [DayOfWeek.THURSDAY]: 'Jue',
  [DayOfWeek.FRIDAY]: 'Vie',
  [DayOfWeek.SATURDAY]: 'Sáb',
  [DayOfWeek.SUNDAY]: 'Dom',
};

/**
 * Horarios por defecto (Lun-Vie 9-18, Sáb 9-13, Dom cerrado)
 */
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '18:00', closed: false },
  tuesday: { open: '09:00', close: '18:00', closed: false },
  wednesday: { open: '09:00', close: '18:00', closed: false },
  thursday: { open: '09:00', close: '18:00', closed: false },
  friday: { open: '09:00', close: '18:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '00:00', close: '00:00', closed: true },
};

/**
 * Límites del sistema
 */
export const AGENCY_LIMITS = {
  MAX_TEAM_MEMBERS: 2,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_COMPANY_NAME_LENGTH: 100,
  MIN_COMPANY_NAME_LENGTH: 3,
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un objeto es un BusinessHours válido
 */
export function isBusinessHours(obj: any): obj is BusinessHours {
  if (!obj || typeof obj !== 'object') return false;
  
  const days: DayOfWeek[] = Object.values(DayOfWeek);
  
  return days.every(day => {
    const schedule = obj[day];
    return (
      schedule &&
      typeof schedule === 'object' &&
      typeof schedule.open === 'string' &&
      typeof schedule.close === 'string' &&
      typeof schedule.closed === 'boolean'
    );
  });
}

/**
 * Verifica si un objeto es un TeamMember válido
 */
export function isTeamMember(obj: any): obj is TeamMember {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.agency_id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.is_active === 'boolean'
  );
}

/**
 * Verifica si un objeto es AgencyStats válido
 */
export function isAgencyStats(obj: any): obj is AgencyStats {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.total_properties === 'number' &&
    typeof obj.active_properties === 'number' &&
    typeof obj.average_price === 'number' &&
    typeof obj.properties_this_month === 'number'
  );
}

// ============================================================================
// HELPERS DE TRANSFORMACIÓN
// ============================================================================

/**
 * Convierte horarios de JSON a BusinessHours tipado
 */
export function parseBusinessHours(json: any): BusinessHours | null {
  try {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }
    
    if (isBusinessHours(json)) {
      return json;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Sanitiza datos del perfil para uso público
 * Aplica configuración de privacidad
 */
export function sanitizePublicProfile(
  profile: InmobiliariaProfile
): InmobiliariaProfile {
  return {
    ...profile,
    phone: profile.show_phone_public ? profile.phone : null,
    commercial_phone: profile.show_phone_public ? profile.commercial_phone : null,
    address: profile.show_address_public ? profile.address : null,
    latitude: profile.show_map_public ? profile.latitude : null,
    longitude: profile.show_map_public ? profile.longitude : null,
  };
}
