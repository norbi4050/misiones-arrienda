/**
 * 🗄️ HOOK PARA SUPABASE STORAGE
 *
 * Hook personalizado para manejar operaciones de Storage en Supabase
 * FASE 2: OPTIMIZACIÓN DE RENDIMIENTO
 */

import { useState, useCallback } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

interface UseSupabaseStorageReturn {
  uploadImage: (file: File, bucket: string, path?: string) => Promise<UploadResult>;
  deleteImage: (bucket: string, path: string) => Promise<boolean>;
  getPublicUrl: (bucket: string, path: string) => string;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
}

/**
 * Hook para manejar operaciones de Supabase Storage
 */
export const useSupabaseStorage = (): UseSupabaseStorageReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = getBrowserClient();

  /**
   * Genera un nombre único para el archivo
   */
  const generateUniqueFileName = useCallback((originalName: string, userId?: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop() || 'jpg';
    const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');

    if (userId) {
      return `${userId}/${baseName}_${timestamp}_${randomString}.${extension}`;
    }

    return `${baseName}_${timestamp}_${randomString}.${extension}`;
  }, []);

  /**
   * Valida el archivo antes de subir
   */
  const validateFile = useCallback((file: File, bucket: string): string | null => {
    // Límites por bucket
    const limits = {
      'property-images': {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      },
      'user-avatars': {
        maxSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      },
      'verification-docs': {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
      }
    };

    const bucketLimits = limits[bucket as keyof typeof limits];
    if (!bucketLimits) {
      return `Bucket '${bucket}' no es válido`;
    }

    // Validar tamaño
    if (file.size > bucketLimits.maxSize) {
      const maxSizeMB = bucketLimits.maxSize / (1024 * 1024);
      return `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`;
    }

    // Validar tipo
    if (!bucketLimits.allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Tipos válidos: ${bucketLimits.allowedTypes.join(', ')}`;
    }

    return null;
  }, []);

  /**
   * Sube una imagen a Supabase Storage
   */
  const uploadImage = useCallback(async (
    file: File,
    bucket: string,
    customPath?: string
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Validar archivo
      const validationError = validateFile(file, bucket);
      if (validationError) {
        throw new Error(validationError);
      }

      // Generar path del archivo
      const fileName = customPath || generateUniqueFileName(file.name);

      // Simular progreso (Supabase no proporciona progreso real)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev) return null;
          const newPercentage = Math.min(prev.percentage + 10, 90);
          return {
            ...prev,
            percentage: newPercentage,
            loaded: (newPercentage / 100) * prev.total
          };
        });
      }, 200);

      // Subir archivo
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      // Completar progreso
      setUploadProgress({ loaded: file.size, total: file.size, percentage: 100 });

      // Obtener URL pública
      const publicUrl = getPublicUrl(bucket, fileName);

      return {
        url: publicUrl,
        path: fileName,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);

      return {
        url: '',
        path: '',
        error: errorMessage
      };
    } finally {
      setIsUploading(false);
      // Limpiar progreso después de 2 segundos
      setTimeout(() => setUploadProgress(null), 2000);
    }
  }, [validateFile, generateUniqueFileName, supabase.storage]);

  /**
   * Elimina una imagen de Supabase Storage
   */
  const deleteImage = useCallback(async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`Error eliminando archivo: ${error.message}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return false;
    }
  }, [supabase.storage]);

  /**
   * Obtiene la URL pública de un archivo
   */
  const getPublicUrl = useCallback((bucket: string, path: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }, [supabase.storage]);

  return {
    uploadImage,
    deleteImage,
    getPublicUrl,
    isUploading,
    uploadProgress,
    error
  };
};

/**
 * Hook específico para imágenes de propiedades
 */
export const usePropertyImages = () => {
  const storage = useSupabaseStorage();

  const uploadPropertyImage = useCallback(async (
    file: File,
    userId: string,
    propertyId: string,
    imageIndex: number = 0
  ): Promise<UploadResult> => {
    const customPath = `${userId}/${propertyId}/image_${imageIndex}_${Date.now()}.${file.name.split('.').pop()}`;
    return storage.uploadImage(file, 'property-images', customPath);
  }, [storage]);

  const deletePropertyImage = useCallback(async (imagePath: string): Promise<boolean> => {
    // Extraer el path del archivo de la URL completa
    const pathMatch = imagePath.match(/property-images\/(.+)$/);
    if (!pathMatch) {
      return false;
    }

    return storage.deleteImage('property-images', pathMatch[1]);
  }, [storage]);

  return {
    ...storage,
    uploadPropertyImage,
    deletePropertyImage
  };
};

/**
 * Hook específico para avatares de usuario
 */
export const useUserAvatars = () => {
  const storage = useSupabaseStorage();

  const uploadAvatar = useCallback(async (
    file: File,
    userId: string
  ): Promise<UploadResult> => {
    const customPath = `${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
    return storage.uploadImage(file, 'user-avatars', customPath);
  }, [storage]);

  const deleteAvatar = useCallback(async (avatarPath: string): Promise<boolean> => {
    // Extraer el path del archivo de la URL completa
    const pathMatch = avatarPath.match(/user-avatars\/(.+)$/);
    if (!pathMatch) {
      return false;
    }

    return storage.deleteImage('user-avatars', pathMatch[1]);
  }, [storage]);

  return {
    ...storage,
    uploadAvatar,
    deleteAvatar
  };
};

/**
 * Utilidades para trabajar con URLs de Storage
 */
export const storageUtils = {
  /**
   * Verifica si una URL es de Supabase Storage
   */
  isStorageUrl: (url: string): boolean => {
    return url.includes('/storage/v1/object/public/');
  },

  /**
   * Verifica si una imagen es Base64
   */
  isBase64Image: (data: string): boolean => {
    return data.startsWith('data:image/');
  },

  /**
   * Extrae el bucket y path de una URL de Storage
   */
  parseStorageUrl: (url: string): { bucket: string; path: string } | null => {
    const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (!match) return null;

    return {
      bucket: match[1],
      path: match[2]
    };
  },

  /**
   * Genera una URL de thumbnail (si Supabase lo soporta en el futuro)
   */
  getThumbnailUrl: (originalUrl: string, width: number = 300): string => {
    // Por ahora retorna la URL original
    // En el futuro se puede implementar transformaciones de imagen
    return originalUrl;
  }
};
