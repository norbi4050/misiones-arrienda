"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  MapPin, 
  Bed, 
  Bath, 
  Car,
  Square,
  Calendar,
  DollarSign,
  TrendingUp,
  Heart,
  MessageSquare
} from 'lucide-react';
import { getOperationLabel } from '@/lib/operation-helpers';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    oldPrice?: number;
    bedrooms: number;
    bathrooms: number;
    garages: number;
    area: number;
    address: string;
    city: string;
    province: string;
    propertyType: string;
    operationType?: string; // NUEVO: tipo de operación
    status: string;
    images: string[];
    featured: boolean;
    featuredExpires?: string | null;
    createdAt: string;
    updatedAt: string;
    activePlan?: {
      planType: string;
      planName: string;
    };
    // Analytics data
    views?: number;
    inquiries?: number;
    favorites?: number;
  };
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  onView?: (propertyId: string) => void;
  onPromote?: (propertyId: string) => void;
  onToggleFeatured?: (propertyId: string) => void;
  isSelected?: boolean;
  onSelect?: (propertyId: string, selected: boolean) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rented':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'sold':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'reserved':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'Disponible';
    case 'rented':
      return 'Alquilado';
    case 'sold':
      return 'Vendido';
    case 'maintenance':
      return 'Mantenimiento';
    case 'reserved':
      return 'Reservado';
    case 'expired':
      return 'Expirado';
    default:
      return status;
  }
};

const getPropertyTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case 'apartment':
      return 'Departamento';
    case 'house':
      return 'Casa';
    case 'commercial':
      return 'Comercial';
    case 'land':
      return 'Terreno';
    case 'office':
      return 'Oficina';
    case 'warehouse':
      return 'Depósito';
    case 'ph':
      return 'PH';
    case 'studio':
      return 'Monoambiente';
    default:
      return type;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'ARS' ? 'ARS' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  onView, 
  onPromote, 
  onToggleFeatured,
  isSelected = false,
  onSelect 
}: PropertyCardProps) {
  const mainImage = (property as any)?.cover_url ?? (property as any)?.coverUrl ?? (property as any)?.image ?? property?.images?.[0] ?? '/placeholder-apartment-1.jpg';

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect?.(property.id, e.target.checked);
  };

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
    }`}>
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={mainImage}
          alt={property.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-apartment-1.jpg';
          }}
        />
        
        {/* Operation Type Badge - Top Left */}
        {property.operationType && (
          <div className="absolute top-3 left-3">
            <Badge 
              className={
                property.operationType === 'venta' 
                  ? 'bg-green-600 text-white' 
                  : property.operationType === 'alquiler'
                  ? 'bg-blue-600 text-white'
                  : 'bg-purple-600 text-white'
              }
            >
              {getOperationLabel(property.operationType, 'badge')}
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {property.featured && property.featuredExpires && new Date(property.featuredExpires) > new Date() && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Destacado
            </Badge>
          </div>
        )}

        {/* Plan Badge */}
        {property.activePlan && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              {property.activePlan.planName}
            </Badge>
          </div>
        )}
      </div>

      {/* Property Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">{property.address}, {property.city}</span>
            </div>
          </div>
          <Badge className={getStatusColor(property.status)}>
            {getStatusLabel(property.status)}
          </Badge>
        </div>

        {/* Property Type */}
        <div className="text-sm text-gray-600 mb-3">
          {getPropertyTypeLabel(property.propertyType)}
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(property.price, property.currency)}
            </span>
            {property.oldPrice && property.oldPrice > property.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(property.oldPrice, property.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Property Features */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms}</span>
          </div>
          {property.garages > 0 && (
            <div className="flex items-center">
              <Car className="w-4 h-4 mr-1" />
              <span>{property.garages}</span>
            </div>
          )}
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span>{property.area}m²</span>
          </div>
        </div>

        {/* Analytics */}
        {(property.views !== undefined || property.inquiries !== undefined || property.favorites !== undefined) && (
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b">
            {property.views !== undefined && (
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                <span>{property.views} vistas</span>
              </div>
            )}
            {property.inquiries !== undefined && (
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                <span>{property.inquiries} consultas</span>
              </div>
            )}
            {property.favorites !== undefined && (
              <div className="flex items-center">
                <Heart className="w-3 h-3 mr-1" />
                <span>{property.favorites} favoritos</span>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Creado: {formatDate(property.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <span>Actualizado: {formatDate(property.updatedAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(property.id)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver
            </Button>
          )}
          
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(property.id)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          )}

          {onPromote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPromote(property.id)}
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Promover
            </Button>
          )}

          {onToggleFeatured && (
            <Button
              variant={property.featured ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFeatured(property.id)}
            >
              <Star className="w-4 h-4" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(property.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
