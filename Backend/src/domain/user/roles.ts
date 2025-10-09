import { z } from 'zod';

// Fuente de verdad: Zod schema compartido
export const RoleEnum = z.enum(['ADMIN', 'OWNER', 'INDIVIDUAL', 'AGENCY'] as const);
export type Role = z.infer<typeof RoleEnum>;

// Definición única de roles de comunidad (mantener compatibilidad)
export const COMMUNITY_ROLES = ['BUSCO', 'OFREZCO', 'INDIVIDUAL', 'TENANT', 'OWNER', 'AGENCY'] as const;
export type CommunityRole = typeof COMMUNITY_ROLES[number];

// Valores por defecto
export const DEFAULT_ROLE: Role = 'INDIVIDUAL';
export const DEFAULT_COMMUNITY_ROLE: CommunityRole = 'BUSCO';

// Validadores helper
export function isValidRole(role: string): role is Role {
  return RoleEnum.safeParse(role).success;
}

export function isValidCommunityRole(role: string): role is CommunityRole {
  return COMMUNITY_ROLES.includes(role as CommunityRole);
}

export function getRoleDefault(): Role {
  return DEFAULT_ROLE;
}

export function getCommunityRoleDefault(): CommunityRole {
  return DEFAULT_COMMUNITY_ROLE;
}

// Mapeo para UI - Roles principales
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Propietario',
  INDIVIDUAL: 'Usuario individual',
  AGENCY: 'Inmobiliaria'
};

// Mapeo para UI - Roles de comunidad (mantener compatibilidad)
export const COMMUNITY_ROLE_LABELS: Record<CommunityRole, string> = {
  BUSCO: 'Busco habitación/compañeros',
  OFREZCO: 'Ofrezco habitación/casa',
  INDIVIDUAL: 'Usuario individual',
  TENANT: 'Inquilino',
  OWNER: 'Propietario',
  AGENCY: 'Inmobiliaria'
};
