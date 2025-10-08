/**
 * Helper functions for agency profile URLs and detection
 * FASE 6: Descubribilidad - Enero 2025
 */

/**
 * Generate URL for agency profile page
 * @param userId - The user ID of the agency
 * @returns URL path to agency profile
 */
export function getAgencyProfileUrl(userId: string): string {
  return `/inmobiliaria/${userId}`;
}

/**
 * Check if a user is an agency based on user_type
 * @param userType - The user_type field from database
 * @returns true if user is an agency
 */
export function isAgency(userType?: string | null): boolean {
  return userType === 'inmobiliaria';
}

/**
 * Get display name for agency
 * @param companyName - The company_name field from database
 * @returns Display name or fallback
 */
export function getAgencyDisplayName(companyName?: string | null): string {
  return companyName || 'Inmobiliaria';
}

/**
 * Check if agency profile link should be shown
 * @param userType - The user_type field
 * @param userId - The user ID
 * @returns true if link should be displayed
 */
export function shouldShowAgencyLink(
  userType?: string | null,
  userId?: string | null
): boolean {
  return isAgency(userType) && !!userId;
}
