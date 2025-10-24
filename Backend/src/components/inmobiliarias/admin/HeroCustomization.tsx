'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ColorPicker from './ColorPicker';
import { Palette, Image as ImageIcon, Type, Save, Eye, Upload, X } from 'lucide-react';
import { DEFAULT_COLORS, AGENCY_LIMITS, HEX_COLOR_REGEX } from '@/types/inmobiliaria';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface HeroCustomizationData {
  header_image_url: string | null;
  tagline: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  founded_year: number | null;
  values: string[] | null;
}

interface HeroCustomizationProps {
  userId: string;
  initialData: HeroCustomizationData;
  onSave?: () => void;
}

export default function HeroCustomization({ userId, initialData, onSave }: HeroCustomizationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<HeroCustomizationData>(initialData);
  const [valueInput, setValueInput] = useState('');

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('type', 'hero_background');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, header_image_url: data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  // Add value to array
  const handleAddValue = () => {
    if (!valueInput.trim()) return;

    if (valueInput.length > AGENCY_LIMITS.MAX_VALUE_LENGTH) {
      toast.error(`Máximo ${AGENCY_LIMITS.MAX_VALUE_LENGTH} caracteres por valor`);
      return;
    }

    const currentValues = formData.values || [];
    if (currentValues.length >= AGENCY_LIMITS.MAX_VALUES) {
      toast.error(`Máximo ${AGENCY_LIMITS.MAX_VALUES} valores`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      values: [...currentValues, valueInput.trim()],
    }));
    setValueInput('');
  };

  // Remove value from array
  const handleRemoveValue = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      values: (prev.values || []).filter((_, i) => i !== index),
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    // Validate tagline length
    if (formData.tagline && formData.tagline.length > AGENCY_LIMITS.MAX_TAGLINE_LENGTH) {
      toast.error(`El tagline no puede superar ${AGENCY_LIMITS.MAX_TAGLINE_LENGTH} caracteres`);
      return false;
    }

    // Validate color format
    if (formData.primary_color && !HEX_COLOR_REGEX.test(formData.primary_color)) {
      toast.error('Color primario inválido (formato: #RRGGBB)');
      return false;
    }

    if (formData.secondary_color && !HEX_COLOR_REGEX.test(formData.secondary_color)) {
      toast.error('Color secundario inválido (formato: #RRGGBB)');
      return false;
    }

    // Validate founded year
    const currentYear = new Date().getFullYear();
    if (
      formData.founded_year &&
      (formData.founded_year < AGENCY_LIMITS.MIN_FOUNDED_YEAR || formData.founded_year > currentYear)
    ) {
      toast.error(`Año de fundación inválido (${AGENCY_LIMITS.MIN_FOUNDED_YEAR}-${currentYear})`);
      return false;
    }

    return true;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/inmobiliarias/${userId}/customization`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      toast.success('Personalización guardada correctamente');
      setIsEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving customization:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleResetColors = () => {
    setFormData((prev) => ({
      ...prev,
      primary_color: DEFAULT_COLORS.PRIMARY,
      secondary_color: DEFAULT_COLORS.SECONDARY,
    }));
  };

  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Personalización Visual</CardTitle>
              <CardDescription>
                Personaliza cómo se ve tu página pública con tu propia identidad de marca
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Palette className="h-4 w-4 mr-2" />
                Personalizar
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Hero Background Image */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-gray-600" />
            <Label className="text-sm font-medium">Imagen de Fondo del Hero</Label>
          </div>
          <p className="text-xs text-gray-500">
            Imagen que aparecerá de fondo en la sección principal de tu perfil público. Recomendado: 1920x500px
          </p>

          {formData.header_image_url ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300">
              <Image
                src={formData.header_image_url}
                alt="Hero background preview"
                fill
                className="object-cover"
              />
              {isEditing && (
                <button
                  onClick={() => setFormData((prev) => ({ ...prev, header_image_url: null }))}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Sin imagen - se usará un gradiente con tus colores</p>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
                id="hero-image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('hero-image-upload')?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Subiendo...' : 'Subir Imagen'}
              </Button>
            </div>
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-600" />
            <Label htmlFor="tagline" className="text-sm font-medium">
              Frase Descriptiva (Tagline)
            </Label>
          </div>
          <p className="text-xs text-gray-500">
            Frase corta que describe tu inmobiliaria (máx. {AGENCY_LIMITS.MAX_TAGLINE_LENGTH} caracteres)
          </p>
          <div className="relative">
            <Textarea
              id="tagline"
              value={formData.tagline || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
              disabled={!isEditing}
              placeholder="Ej: Tu aliado en el mercado inmobiliario de Posadas"
              maxLength={AGENCY_LIMITS.MAX_TAGLINE_LENGTH}
              rows={2}
              className="resize-none"
            />
            <span className="absolute bottom-2 right-2 text-xs text-gray-400">
              {(formData.tagline || '').length}/{AGENCY_LIMITS.MAX_TAGLINE_LENGTH}
            </span>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorPicker
            label="Color Principal"
            value={formData.primary_color || DEFAULT_COLORS.PRIMARY}
            onChange={(color) => setFormData((prev) => ({ ...prev, primary_color: color }))}
            disabled={!isEditing}
          />

          <ColorPicker
            label="Color Secundario"
            value={formData.secondary_color || DEFAULT_COLORS.SECONDARY}
            onChange={(color) => setFormData((prev) => ({ ...prev, secondary_color: color }))}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <Button variant="ghost" size="sm" onClick={handleResetColors}>
            Restaurar colores por defecto
          </Button>
        )}

        {/* Founded Year */}
        <div className="space-y-3">
          <Label htmlFor="founded-year" className="text-sm font-medium">
            Año de Fundación
          </Label>
          <Input
            id="founded-year"
            type="number"
            value={formData.founded_year || ''}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                founded_year: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            disabled={!isEditing}
            placeholder={`${AGENCY_LIMITS.MIN_FOUNDED_YEAR} - ${currentYear}`}
            min={AGENCY_LIMITS.MIN_FOUNDED_YEAR}
            max={currentYear}
          />
        </div>

        {/* Values */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Valores de la Empresa</Label>
          <p className="text-xs text-gray-500">
            Agrega hasta {AGENCY_LIMITS.MAX_VALUES} valores que representen a tu inmobiliaria
          </p>

          {/* Current values */}
          {formData.values && formData.values.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.values.map((value, index) => (
                <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>{value}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveValue(index)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add value input */}
          {isEditing && (formData.values || []).length < AGENCY_LIMITS.MAX_VALUES && (
            <div className="flex gap-2">
              <Input
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                placeholder="Ej: Transparencia, Profesionalismo..."
                maxLength={AGENCY_LIMITS.MAX_VALUE_LENGTH}
              />
              <Button type="button" onClick={handleAddValue} variant="outline">
                Agregar
              </Button>
            </div>
          )}
        </div>

        {/* Preview link */}
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <a href={`/inmobiliaria/${userId}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Ver Vista Previa de mi Página Pública
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
