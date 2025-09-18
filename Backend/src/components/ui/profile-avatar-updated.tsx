"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import {
  Camera,
  Upload,
  AlertCircle,
  Loader2,
  User,
  Trash2
} from 'lucide-react';
import { cn } from "@/utils";
import { AvatarUniversal } from './avatar-universal';
import { getAvatarUrl } from '@/utils/avatar';
import toast from 'react-hot-toast';

interface ProfileAvatarProps {
  src?: string;
  name?: string;
  userId?: string;
  updatedAt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUpload?: boolean;
  allowedFormats?: string[];
  maxSizeInMB?: number;
  onImageChange?: (url: string) => void;
  className?: string;
}

export function ProfileAvatar({
  src,
  name = 'Usuario',
  userId,
  updatedAt,
  size = 'lg',
  showUpload = true,
  allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  maxSizeInMB = 5,
  onImageChange,
  className
}: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(src || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar imagen cuando cambie la prop src
  useEffect(() => {
    setCurrentImageUrl(src || null);
  }, [src]);

  // Generar URL con cache-busting
  const cacheBustedUrl = getAvatarUrl({
    profileImage: currentImageUrl,
    updatedAt
  });

  // Tamaños del avatar
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
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
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

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

  // Subir archivo
  const uploadFile = async (file: File) => {
    if (!userId) {
      toast.error('Usuario no identificado');
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Comprimir imagen
      const compressedBlob = await compressImage(file);
      if (!compressedBlob) {
        throw new Error('Error al comprimir la imagen');
      }

      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Crear FormData
      const formData = new FormData();
      formData.append('file', compressedBlob, `avatar-${userId}-${Date.now()}.jpg`);
      formData.append('userId', userId);

      // Subir a la API
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }

      const data = await response.json();
      
      // Actualizar estado local con URL cache-busted
      setCurrentImageUrl(data.originalUrl);
      setPreviewUrl(null);
      
      // Notificar cambio con URL cache-busted
      if (onImageChange) {
        onImageChange(data.imageUrl || data.originalUrl);
      }

      toast.success('Avatar actualizado correctamente');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(`Error al subir avatar: ${errorMessage}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Eliminar avatar
  const handleRemoveAvatar = async () => {
    if (!userId) {
      toast.error('Usuario no identificado');
      return;
    }

    setUploading(true);

    try {
      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al eliminar avatar');
      }

      setCurrentImageUrl(null);
      setPreviewUrl(null);
      
      if (onImageChange) {
        onImageChange('');
      }

      toast.success('Avatar eliminado correctamente');

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error al eliminar avatar');
    } finally {
      setUploading(false);
    }
  };

  // Manejar selección de archivo
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Manejar drag & drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const displayImageUrl = previewUrl || cacheBustedUrl;

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Avatar principal */}
      <div
        className={cn(
          "relative w-full h-full",
          showUpload && "cursor-pointer",
          dragOver && "ring-2 ring-blue-400"
        )}
        onClick={showUpload ? openFileSelector : undefined}
        onDrop={showUpload ? handleDrop : undefined}
        onDragOver={showUpload ? handleDragOver : undefined}
        onDragLeave={showUpload ? handleDragLeave : undefined}
      >
        <AvatarUniversal
          src={displayImageUrl}
          name={name}
          updatedAt={updatedAt}
          size={size === 'sm' ? 'sm' : size === 'md' ? 'md' : size === 'lg' ? 'lg' : 'xl'}
          showFallback={true}
          loading={uploading}
        />

        {/* Overlay de loading */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Controles de edición */}
      {showUpload && !uploading && (
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

          {currentImageUrl && (
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
      {uploading && (
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
      {showUpload && size === 'xl' && !displayImageUrl && (
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

export default ProfileAvatar;
