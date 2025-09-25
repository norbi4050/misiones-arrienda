// Definición única de roles de comunidad
export const COMMUNITY_ROLES = ['BUSCO', 'OFREZCO', 'TENANT', 'OWNER', 'AGENCY'] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

// Valores por defecto
export const DEFAULT_COMMUNITY_ROLE: CommunityRole = 'BUSCO';

// Validadores helper
export function isValidCommunityRole(role: string): role is CommunityRole {
  return COMMUNITY_ROLES.includes(role as CommunityRole);
}

export function getCommunityRoleDefault(): CommunityRole {
  return DEFAULT_COMMUNITY_ROLE;
}

// Mapeo para UI
export const COMMUNITY_ROLE_LABELS: Record<CommunityRole, string> = {
  BUSCO: 'Busco habitación/compañeros',
  OFREZCO: 'Ofrezco habitación/casa',
  TENANT: 'Inquilino',
  OWNER: 'Propietario',
  AGENCY: 'Inmobiliaria'
};
