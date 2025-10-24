'use client';

import Image from 'next/image';
import { DEFAULT_COLORS } from '@/types/inmobiliaria';

interface HeroBackgroundProps {
  imageUrl: string | null;
  primaryColor: string | null;
}

export default function HeroBackground({ imageUrl, primaryColor }: HeroBackgroundProps) {
  const color = primaryColor || DEFAULT_COLORS.PRIMARY;

  if (imageUrl) {
    return (
      <div className="absolute inset-0 z-0">
        <Image
          src={imageUrl}
          alt="Background"
          fill
          sizes="100vw"
          priority
          className="object-cover"
          quality={85}
        />
      </div>
    );
  }

  // Gradiente elegante si no hay imagen
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -30)} 100%)`,
      }}
    />
  );
}

/**
 * Ajusta el brillo de un color hex
 * @param hex - Color en formato #RRGGBB
 * @param percent - Porcentaje de ajuste (-100 a 100)
 */
function adjustColor(hex: string, percent: number): string {
  // Remover el #
  const num = parseInt(hex.replace('#', ''), 16);

  // Extraer componentes RGB
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  // Limitar valores entre 0-255
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));

  // Convertir de vuelta a hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
