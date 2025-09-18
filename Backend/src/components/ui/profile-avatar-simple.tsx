"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Camera, Upload, Loader2, User, Trash2 } from 'lucide-react';
import { cn } from "@/utils";
import toast from 'react-hot-toast';
import { getBrowserSupabase } from '@/lib/supabaseClient';

interface ProfileAvatarSimpleProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUpload?: boolean;
  onImageChange?: (url: string) => void;
  className?: string;
}

export function ProfileAvatarSimple({
  userId,
  size = 'lg',
  showUpload = true,
  onImageChange,
  className
}: ProfileAvatarSimpleProps) {
  const supabase = getBrowserSupabase();
  const [uploading, setUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Usuario');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tamaños del avatar
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // ESTRATEGIA SIMPLE: Consulta directa a la base de datos (igual que navbar)
  const loadAvatarDirect = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('profile_image, name')
        .eq('id', userId)
        .single();

      if (!error && data) {
        // Cache-busting simple con timestamp actual
        const avatarUrl = data.profile_image 
          ? `${data.profile_image}?v=${Date.now()}`
          : null;
        
        setCurrentImageUrl(avatarUrl);
        setUserName(data.name || 'Usuario');
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  }, [supabase, userId]);

  // Cargar avatar al montar y cuando cambie userId
  useEffect(() => {
    if (userId) {
      loadAvatarDirect();
    }
  }, [userId, loadAvatarDirect]);

  // Generar iniciales del nombre
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  // Subir archivo
  const handleFileUpload = async (file: File) => {
    if (!file || uploading) return;

    try {
      setUploading(true);

      // Validaciones básicas
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato no permitido. Use JPEG, PNG o WebP');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Archivo muy grande. Máximo 5MB');
        return;
      }

      // Usar la API existente
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir avatar');
      }

      const result = await response.json();
      
      // Actualización inmediata con cache-busting
      const newUrl = `${result.originalUrl || result.imageUrl}?v=${Date.now()}`;
      setCurrentImageUrl(newUrl);
      
      // Notificar cambio
      if (onImageChange) {
        onImageChange(newUrl);
      }

      toast.success('Avatar actualizado correctamente');

      // Recargar después de un momento para asegurar persistencia
      setTimeout(() => {
        loadAvatarDirect();
      }, 1000);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir avatar');
    } finally {
      setUploading(false);
    }
  };

  // Eliminar avatar
  const handleRemoveAvatar = async () => {
    try {
      setUploading(true);

      const response = await fetch('/api/users/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar avatar');
      }

      setCurrentImageUrl(null);
      toast.success('Avatar eliminado correctamente');

      // Recargar para confirmar
      setTimeout(() => {
        loadAvatarDirect();
      }, 500);

    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error('Error al eliminar avatar');
    } finally {
      setUploading(false);
    }
  };

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // Manejar selección de archivo
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Manejar drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div 
      className={cn("relative", className)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Avatar principal */}
      <div className={cn(
        "relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center",
        sizeClasses[size],
        dragOver && "border-blue-400 scale-105",
        uploading && "opacity-50"
      )}>
        {currentImageUrl ? (
          <img
            src={currentImageUrl}
            alt={`Avatar de ${userName}`}
            className="w-full h-full object-cover"
            onError={() => setCurrentImageUrl(null)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {getInitials(userName)}
          </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
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
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Zona de drop para tamaños grandes */}
      {showUpload && size === 'xl' && !currentImageUrl && (
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

export default ProfileAvatarSimple;
