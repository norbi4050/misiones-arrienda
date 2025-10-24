'use client';

import { Home, TrendingUp, DollarSign } from 'lucide-react';
import { DEFAULT_COLORS } from '@/types/inmobiliaria';

interface HeroStatsProps {
  totalProperties: number;
  activeProperties: number;
  averagePrice: number;
  primaryColor: string | null;
}

export default function HeroStats({
  totalProperties,
  activeProperties,
  averagePrice,
  primaryColor,
}: HeroStatsProps) {
  const color = primaryColor || DEFAULT_COLORS.PRIMARY;

  const stats = [
    {
      icon: Home,
      value: totalProperties,
      label: totalProperties === 1 ? 'Propiedad' : 'Propiedades',
    },
    {
      icon: TrendingUp,
      value: activeProperties,
      label: activeProperties === 1 ? 'Activa' : 'Activas',
    },
    {
      icon: DollarSign,
      value: `$${(averagePrice / 1000).toFixed(0)}K`,
      label: 'Precio Promedio',
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 text-white/90">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="flex items-center gap-2">
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
            <div className="text-left">
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/70">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
