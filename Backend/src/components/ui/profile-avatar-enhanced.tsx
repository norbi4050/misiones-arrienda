"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import {
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  User,
  Edit3,
  Trash2,
  RotateCcw,
  Crop,
  Download
} from 'lucide-react';
import { cn } from "@/utils";
import toast from 'react-hot-toast';

interface ProfileAvatarEnhancedProps {
  src?: string;
  name?: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  showUploadProgress?: boolean;
  allowedFormats?: string[];
  maxSizeInMB?: number;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export function ProfileAvatarEnhanced({
  src,
  name = 'Usuario',
  userId,
  size = 'lg',
  editable = true,
  showUploadProgress = true,
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 5,
  onUploadComplete,
  onUploadError,
  className
}: ProfileAvatarEnhancedProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tamaños del avatar
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  // Generar iniciales del nombre
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Validar archivo
  const validateFile = (file: File): string | null => {
    if (!allowedFormats.includes(file.type)) {
      return `Formato no permitido. Use: ${allowedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }

    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `El archivo es muy grande. Máximo ${maxSizeInMB}MB`;
    }

    return null;
  };

  // Comprimir imagen
  const compressImage = (file: File, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones manteniendo aspect ratio
        const maxSize = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(new Blob());
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Crear preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);

      // Comprimir imagen
      setUploadProgress(20);
      const compressedBlob = await compressImage(file);

      if (!compressedBlob) {
        throw new Error('Error al comprimir la imagen');
      }

      setUploadProgress(40);

      // Crear FormData para upload
      const formData = new FormData();
      formData.append('file', compressedBlob, `avatar-${userId}-${Date.now()}.jpg`);
      formData.append('userId', userId || '');

      setUploadProgress(60);

      // Subir a la API
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir la imagen');
      }

      const { imageUrl } = await response.json();

      setUploadProgress(100);

      // Limpiar preview
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      onUploadComplete?.(imageUrl);
      toast.success('Avatar actualizado correctamente');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      toast.error(errorMessage);

      // Limpiar preview en caso de error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [userId, allowedFormats, maxSizeInMB, onUploadComplete, onUploadError, previewUrl]);

  // Manejar drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Manejar click en input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Eliminar avatar
  const handleRemoveAvatar = async () => {
    if (!src) return;

    try {
      setUploading(true);

      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar avatar');
      }

      onUploadComplete?.('');
      toast.success('Avatar eliminado');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error al eliminar avatar');
    } finally {
      setUploading(false);
    }
  };

  const currentImageUrl = previewUrl || src;

  return (
    <div className={cn("relative", className)}>
      {/* Avatar principal */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-purple-500",
          sizeClasses[size],
          dragOver && editable && "border-blue-400 scale-105",
          uploading && "opacity-75",
          "transition-all duration-200"
        )}
        onDragOver={editable ? handleDragOver : undefined}
        onDragLeave={editable ? handleDragLeave : undefined}
        onDrop={editable ? handleDrop : undefined}
      >
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={`Avatar de ${name}`}
            className="w-full h-full object-cover"
            onError={() => setError('Error al cargar la imagen')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {name ? getInitials(name) : <User className={iconSizes[size]} />}
          </div>
        )}

        {/* Overlay de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className={cn("animate-spin mx-auto mb-1", iconSizes[size])} />
              {showUploadProgress && (
                <div className="text-xs">{uploadProgress}%</div>
              )}
            </div>
          </div>
        )}

        {/* Overlay de drag */}
        {dragOver && editable && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-75 flex items-center justify-center">
            <Upload className={cn("text-white", iconSizes[size])} />
          </div>
        )}

        {/* Badge de estado */}
        {error && (
          <div className="absolute -top-1 -right-1">
            <Badge variant="destructive" className="p-1">
              <AlertCircle className="w-3 h-3" />
            </Badge>
          </div>
        )}

        {uploading && (
          <div className="absolute -top-1 -right-1">
            <Badge className="p-1 bg-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
            </Badge>
          </div>
        )}
      </div>

      {/* Controles de edición */}
      {editable && !uploading && (
        <div className="absolute -bottom-2 -right-2 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full w-8 h-8 p-0 bg-white shadow-md hover:bg-gray-50"
            onClick={openFileSelector}
            title="Cambiar avatar"
          >
            <Camera className="w-4 h-4" />
          </Button>

          {src && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full w-8 h-8 p-0 bg-white shadow-md hover:bg-red-50 text-red-600"
              onClick={handleRemoveAvatar}
              title="Eliminar avatar"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedFormats.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Barra de progreso */}
      {uploading && showUploadProgress && (
        <div className="absolute -bottom-8 left-0 right-0">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Zona de drop para tamaños grandes */}
      {editable && size === 'xl' && !currentImageUrl && (
        <div
          className={cn(
            "absolute inset-0 border-2 border-dashed border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors",
            dragOver && "border-blue-400 bg-blue-50"
          )}
          onClick={openFileSelector}
        >
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">
            Arrastra una imagen o haz clic
          </span>
        </div>
      )}
    </div>
  );
}

// Componente compacto para listas
export function ProfileAvatarCompact({
  src,
  name,
  className
}: {
  src?: string;
  name?: string;
  className?: string;
}) {
  return (
    <ProfileAvatarEnhanced
      src={src}
      name={name}
      size="sm"
      editable={false}
      className={className}
    />
  );
}

// Componente con información adicional
export function ProfileAvatarWithInfo({
  src,
  name,
  subtitle,
  verified = false,
  online = false,
  className
}: {
  src?: string;
  name?: string;
  subtitle?: string;
  verified?: boolean;
  online?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <ProfileAvatarEnhanced
          src={src}
          name={name}
          size="md"
          editable={false}
        />

        {/* Indicador online */}
        {online && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{name}</h4>
          {verified && (
            <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default ProfileAvatarEnhanced;
