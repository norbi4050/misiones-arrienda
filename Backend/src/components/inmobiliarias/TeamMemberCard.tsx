'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { TeamMember } from '@/types/inmobiliaria';

interface TeamMemberCardProps {
  member: TeamMember;
  className?: string;
}

/**
 * Componente: Card de Miembro del Equipo
 *
 * Muestra:
 * - Foto rectangular vertical estilo Instagram (120x150px)
 * - Nombre completo
 *
 * NO incluye (según especificaciones):
 * - Bio
 * - Contacto individual
 * - Cargo/posición
 *
 * Uso: Perfil público de inmobiliarias (máximo 2 miembros)
 */
export default function TeamMemberCard({ member, className = '' }: TeamMemberCardProps) {
  return (
    <div className={`flex flex-col items-center text-center p-4 rounded-xl hover:bg-gray-50 transition-colors ${className}`}>
      {/* Foto del miembro - estilo Instagram vertical */}
      <div className="relative w-32 h-40 mb-3 group">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            sizes="128px"
            className="rounded-2xl object-cover ring-4 ring-blue-100 shadow-lg group-hover:ring-blue-200 group-hover:shadow-xl transition-all"
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-4 ring-blue-100 shadow-lg group-hover:ring-blue-200 group-hover:shadow-xl transition-all">
            <User className="w-16 h-16 text-blue-600" />
          </div>
        )}
      </div>

      {/* Nombre */}
      <h4 className="text-base font-semibold text-gray-900">
        {member.name}
      </h4>
    </div>
  );
}
