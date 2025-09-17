"use client";

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import {
  Edit3,
  Save,
  X,
  User,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Users,
  Heart,
  Home,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from "@/utils";
import toast from 'react-hot-toast';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  search_type: string;
  budget_range: string;
  preferred_areas: string;
  family_size: number | null;
  pet_friendly: boolean;
  move_in_date: string;
  employment_status: string;
  monthly_income: number | null;
}

interface ProfileFormProps {
  initialData: Partial<ProfileData>;
  onSave: (data: Partial<ProfileData>) => Promise<void>;
  className?: string;
}

const searchTypeOptions = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'room', label: 'Habitación' },
  { value: 'studio', label: 'Monoambiente' },
  { value: 'any', label: 'Cualquiera' }
];

const budgetRanges = [
  { value: '0-50000', label: 'Hasta $50.000' },
  { value: '50000-100000', label: '$50.000 - $100.000' },
  { value: '100000-200000', label: '$100.000 - $200.000' },
  { value: '200000-300000', label: '$200.000 - $300.000' },
  { value: '300000+', label: 'Más de $300.000' }
];

const employmentOptions = [
  { value: 'employed', label: 'Empleado' },
  { value: 'self_employed', label: 'Trabajador independiente' },
  { value: 'student', label: 'Estudiante' },
  { value: 'retired', label: 'Jubilado' },
  { value: 'unemployed', label: 'Desempleado' },
  { value: 'other', label: 'Otro' }
];

export function ProfileForm({ initialData, onSave, className }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>(initialData);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Calculate profile completion percentage
  useEffect(() => {
    const fields = [
      'name', 'phone', 'location', 'bio', 'search_type',
      'budget_range', 'preferred_areas', 'employment_status'
    ];
    const filledFields = fields.filter(field => {
      const value = formData[field as keyof ProfileData];
      return value && value.toString().trim() !== '';
    });
    setCompletionPercentage(Math.round((filledFields.length / fields.length) * 100));
  }, [formData]);

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setIsEditing(false);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Profile Completion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Completitud del Perfil</CardTitle>
            <Badge variant={completionPercentage >= 80 ? "default" : "secondary"}>
              {completionPercentage}%
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                completionPercentage >= 80 ? "bg-green-500" :
                completionPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email || ''}
                disabled={true}
                placeholder="tu@email.com"
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="+54 9 11 1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="location">Ciudad</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                placeholder="Posadas, Misiones"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Descripción personal</Label>
            <Textarea
              id="bio"
              value={formData.bio || ''}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              disabled={!isEditing}
              placeholder="Cuéntanos sobre ti, tus intereses, estilo de vida..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Preferencias de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search_type">Tipo de propiedad</Label>
              <Select
                value={formData.search_type || ''}
                onValueChange={(value) => handleInputChange('search_type', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {searchTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget_range">Rango de presupuesto</Label>
              <Select
                value={formData.budget_range || ''}
                onValueChange={(value) => handleInputChange('budget_range', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="preferred_areas">Zonas preferidas</Label>
            <Input
              id="preferred_areas"
              value={formData.preferred_areas || ''}
              onChange={(e) => handleInputChange('preferred_areas', e.target.value)}
              disabled={!isEditing}
              placeholder="Centro, Villa Cabello, Itaembé Guazú..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Family & Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Familia y Estilo de Vida
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="family_size">Tamaño de familia</Label>
              <Select
                value={formData.family_size?.toString() || ''}
                onValueChange={(value) => handleInputChange('family_size', value ? parseInt(value) : null)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Personas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 persona</SelectItem>
                  <SelectItem value="2">2 personas</SelectItem>
                  <SelectItem value="3">3 personas</SelectItem>
                  <SelectItem value="4">4 personas</SelectItem>
                  <SelectItem value="5">5+ personas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pet_friendly">Mascotas</Label>
              <Select
                value={formData.pet_friendly?.toString() || ''}
                onValueChange={(value) => handleInputChange('pet_friendly', value === 'true')}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="¿Tienes mascotas?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No tengo mascotas</SelectItem>
                  <SelectItem value="true">Sí, tengo mascotas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="move_in_date">Fecha de mudanza</Label>
              <Input
                id="move_in_date"
                type="date"
                value={formData.move_in_date || ''}
                onChange={(e) => handleInputChange('move_in_date', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment & Income */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Información Laboral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employment_status">Estado laboral</Label>
              <Select
                value={formData.employment_status || ''}
                onValueChange={(value) => handleInputChange('employment_status', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu situación" />
                </SelectTrigger>
                <SelectContent>
                  {employmentOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="monthly_income">Ingresos mensuales (opcional)</Label>
              <Input
                id="monthly_income"
                type="number"
                value={formData.monthly_income || ''}
                onChange={(e) => handleInputChange('monthly_income', e.target.value ? parseFloat(e.target.value) : null)}
                disabled={!isEditing}
                placeholder="150000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            loading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      )}
    </div>
  );
}
