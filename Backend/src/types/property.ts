export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  area: number;
  lotArea?: number;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  propertyType: PropertyType;
  listingType: ListingType;
  status: PropertyStatus;
  images: string[];
  virtualTourUrl?: string;
  amenities: string[];
  features: string[];
  yearBuilt?: number;
  floor?: number;
  totalFloors?: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    rating: number;
  };
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
}

export type PropertyType = 
  | 'APARTMENT' 
  | 'HOUSE' 
  | 'COMMERCIAL' 
  | 'LAND' 
  | 'OFFICE' 
  | 'WAREHOUSE' 
  | 'PH' 
  | 'STUDIO';

export type PropertyStatus = 
  | 'AVAILABLE' 
  | 'RENTED' 
  | 'SOLD' 
  | 'MAINTENANCE' 
  | 'RESERVED';

export type ListingType = 
  | 'RENT' 
  | 'SALE' 
  | 'BOTH';

export interface PropertyFilters {
  city?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  propertyType?: PropertyType;
  listingType?: ListingType;
  featured?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertyResponse {
  properties: Property[];
  pagination: PaginationInfo;
}

export interface InquiryData {
  name: string;
  email: string;
  phone: string;
  message: string;
  type: 'GENERAL' | 'VISIT' | 'FINANCING' | 'OFFER';
  visitDate?: string;
  propertyId: string;
}
