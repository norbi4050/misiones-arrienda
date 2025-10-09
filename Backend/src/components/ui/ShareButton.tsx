"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareButtonProps {
  url: string;
  className?: string;
}

export function ShareButton({ url, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: 'Propiedad en Misiones Arrienda',
          url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Enlace copiado al portapapeles');
        
        // Reset después de 2 segundos
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Error al compartir');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleShare}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}
