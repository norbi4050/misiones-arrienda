'use client';

import { InmobiliariaProfile, AgencyStats } from '@/types/inmobiliaria';
import HeroBackground from './HeroBackground';
import HeroStats from './HeroStats';
import VerifiedBadge from '../badges/VerifiedBadge';
import FounderBadge from '../badges/FounderBadge';
import ExperienceBadge from '../badges/ExperienceBadge';
import SendMessageButton from '../SendMessageButton';
import Image from 'next/image';
import { Building2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  profile: InmobiliariaProfile;
  stats?: AgencyStats | null;
  totalProperties: number;
}

export default function HeroSection({ profile, stats, totalProperties }: HeroSectionProps) {
  const {
    id,
    company_name,
    logo_url,
    verified,
    is_founder,
    header_image_url,
    tagline,
    primary_color,
    founded_year,
    created_at,
  } = profile;

  // Calcular años de experiencia
  const currentYear = new Date().getFullYear();
  const experienceYears = founded_year
    ? currentYear - founded_year
    : currentYear - new Date(created_at).getFullYear();

  // Scroll suave a propiedades
  const scrollToProperties = () => {
    const propertiesSection = document.getElementById('properties-section');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative h-[500px] md:h-[520px] overflow-hidden">
      {/* Background con imagen o gradiente */}
      <HeroBackground imageUrl={header_image_url} primaryColor={primary_color} />

      {/* Overlay oscuro para legibilidad - más oscuro para mejor contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 z-10" />

      {/* Contenido del Hero */}
      <div className="relative z-20 h-full flex items-center justify-center px-4">
        <div className="max-w-4xl w-full text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            {logo_url ? (
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white/30 shadow-2xl backdrop-blur-sm">
                <Image
                  src={logo_url}
                  alt={`Logo de ${company_name}`}
                  fill
                  sizes="(max-width: 768px) 128px, 160px"
                  priority
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-2xl">
                <Building2 className="w-16 h-16 md:w-20 md:h-20 text-white/80" />
              </div>
            )}
          </div>

          {/* Nombre de la empresa */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {company_name}
          </h1>

          {/* Badges */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 flex-wrap">
            {verified && <VerifiedBadge />}
            {is_founder && <FounderBadge />}
            {experienceYears > 0 && <ExperienceBadge years={experienceYears} />}
          </div>

          {/* Tagline */}
          {tagline && (
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light mb-8 max-w-2xl mx-auto drop-shadow-md">
              {tagline}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-8">
            <Button
              size="lg"
              variant="default"
              onClick={scrollToProperties}
              className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-white text-gray-900 hover:bg-gray-100 shadow-xl"
              style={{
                backgroundColor: 'white',
                color: '#111827',
              }}
            >
              <Eye className="w-5 h-5 mr-2" />
              Ver Propiedades
            </Button>

            <SendMessageButton
              agencyId={id}
              agencyName={company_name}
              className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white hover:bg-white/20 shadow-xl"
            />
          </div>

          {/* Stats rápidas */}
          {stats && (
            <HeroStats
              totalProperties={totalProperties}
              activeProperties={stats.active_properties}
              averagePrice={stats.average_price}
              primaryColor={primary_color}
            />
          )}
        </div>
      </div>
    </section>
  );
}
