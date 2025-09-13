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
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProfileAvatarProps {
  src?: string;
  name?: string;
  userId?: string;
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
      
      // Actualizar estado local inmediatamente
      setCurrentImageUrl(imageUrl);
      
      // Limpiar preview
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      
      // Notificar al componente padre
      onImageChange?.(imageUrl);
      toast.success('Avatar actualizado correctamente');

    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
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
  }, [userId, allowedFormats, maxSizeInMB, onImageChange, previewUrl]);

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
    if (!currentImageUrl) return;
    
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

      // Actualizar estado local inmediatamente
      setCurrentImageUrl(null);
      
      // Notificar al componente padre
      onImageChange?.('');
      toast.success('Avatar eliminado');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error al eliminar avatar');
    } finally {
      setUploading(false);
    }
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className={cn("relative", className)}>
      {/* Avatar principal */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-purple-500",
          sizeClasses[size],
          dragOver && showUpload && "border-blue-400 scale-105",
          uploading && "opacity-75",
          "transition-all duration-200"
        )}
        onDragOver={showUpload ? handleDragOver : undefined}
        onDragLeave={showUpload ? handleDragLeave : undefined}
        onDrop={showUpload ? handleDrop : undefined}
      >
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={`Avatar de ${name}`}
            className="w-full h-full object-cover"
            onError={() => {
              setError('Error al cargar la imagen');
              setCurrentImageUrl(null);
            }}
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
              <div className="text-xs">{uploadProgress}%</div>
            </div>
          </div>
        )}

        {/* Overlay de drag */}
        {dragOver && showUpload && (
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
