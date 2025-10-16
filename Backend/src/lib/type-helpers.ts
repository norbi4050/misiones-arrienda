import { PropertyStatus, PropertyType } from '@/types/property';

/**
 * Type normalization helpers to safely convert strings to union types
 * These functions ensure type safety when data comes from external sources (DB/API)
 * 
 * NOTA: ListingType fue eliminado del tipo Property.
 * Ahora se usa operationType en su lugar.
 */

// Helper to normalize PropertyStatus
export const normalizePropertyStatus = (status: string | PropertyStatus): PropertyStatus => {
  const validStatuses: PropertyStatus[] = ['AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED'];
  const upperStatus = status.toString().toUpperCase();
  return (validStatuses as readonly string[]).includes(upperStatus) 
    ? (upperStatus as PropertyStatus) 
    : 'AVAILABLE';
};

// Helper to normalize PropertyType
export const normalizePropertyType = (type: string | PropertyType): PropertyType => {
  const validTypes: PropertyType[] = ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO'];
  const upperType = type.toString().toUpperCase();
  return (validTypes as readonly string[]).includes(upperType) 
    ? (upperType as PropertyType) 
    : 'HOUSE';
};

/**
 * Comprehensive property normalizer
 * Normalizes all enum fields in a property object to ensure type safety
 */
export const normalizeProperty = (property: any): any => {
  return {
    ...property,
    status: normalizePropertyStatus(property.status),
    propertyType: normalizePropertyType(property.propertyType),
    // NOTA: listingType ya no existe en Property, se usa operationType
    // Ensure dates are properly formatted
    createdAt: property.createdAt instanceof Date 
      ? property.createdAt.toISOString() 
      : property.createdAt,
    updatedAt: property.updatedAt instanceof Date 
      ? property.updatedAt.toISOString() 
      : property.updatedAt,
    // Ensure arrays are properly initialized
    images: Array.isArray(property.images) ? property.images : [],
    amenities: Array.isArray(property.amenities) ? property.amenities : [],
    features: Array.isArray(property.features) ? property.features : [],
    // Ensure agent object is properly structured
    agent: property.agent ? {
      id: property.agent.id || '',
      name: property.agent.name || '',
      email: property.agent.email || '',
      phone: property.agent.phone || '',
      avatar: property.agent.avatar || property.agent.avatarUrl || '',
      rating: typeof property.agent.rating === 'number' ? property.agent.rating : 0,
    } : {
      id: '',
      name: '',
      email: '',
      phone: '',
      avatar: '',
      rating: 0,
    }
  };
};
