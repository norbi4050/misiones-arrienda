import { Property, PropertyResponse, PropertyFilters } from '@/types/property';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export async function getProperties(filters?: PropertyFilters & { page?: number; limit?: number }) {
  const params = new URLSearchParams();
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const response = await fetch(`${API_BASE_URL}/api/properties?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  
  return response.json() as Promise<PropertyResponse>;
}

export async function getProperty(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/properties/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch property');
  }
  
  return response.json();
}

export async function submitInquiry(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
  type: 'GENERAL' | 'VISIT' | 'FINANCING' | 'OFFER';
  visitDate?: string;
  propertyId: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit inquiry');
  }

  return response.json();
}
