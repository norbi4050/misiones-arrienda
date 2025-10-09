'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface TeamPhotoUploaderProps {
  currentPhotoUrl: string | null;
  onUploadSuccess: (photoUrl: string) => void;
  onDeleteSuccess: () => void;
  disabled?: boolean;
  memberId: string;
}

/**
 * Componente: Uploader de Fotos del Equipo
 * 
 * Permite subir/eliminar fotos de miembros del equipo:
 * - Validación de tipo y tamaño (máx 2MB)
 * - Upload a Supabase Storage (bucket: team-photos)
 * - Preview inmediato
 * - Feedback con toasts
 * 
 * Uso: TeamEditor (Mi Empresa)
 */
export default function TeamPhotoUploader({
  currentPhotoUrl,
  onUploadSuccess,
  onDeleteSuccess,
  disabled = false,
  memberId
}: TeamPhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (máx 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('memberId', memberId);

      const response = await fetch('/api/inmobiliarias/team/photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al subir foto');
      }

      const { photoUrl } = await response.json();
      onUploadSuccess(photoUrl);
      toast.success('Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la foto');
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentPhotoUrl) return;
    
    if (!confirm('¿Eliminar esta foto?')) return;

    setDeleting(true);

    try {
      const response = await fetch('/api/inmobiliarias/team/photo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: currentPhotoUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar foto');
      }

      onDeleteSuccess();
      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la foto');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-shrink-0">
      {/* Preview de la foto */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600">
        {currentPhotoUrl ? (
          <>
            <Image
              src={currentPhotoUrl}
              alt="Foto del miembro"
              fill
              sizes="80px"
              className="object-cover"
            />
            {!disabled && !deleting && (
              <button
                type="button"
                onClick={handleDelete}
                className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-md"
                title="Eliminar foto"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {deleting && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || uploading || deleting}
        className="hidden"
        aria-label="Seleccionar foto"
      />

      {/* Botón de upload */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading || deleting}
        className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Upload className="w-3 h-3" />
        <span>{uploading ? 'Subiendo...' : currentPhotoUrl ? 'Cambiar foto' : 'Subir foto'}</span>
      </button>

      {/* Hint */}
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Máx 2MB
      </p>
    </div>
  );
}
