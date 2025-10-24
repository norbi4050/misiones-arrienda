'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { TeamMember } from '@/types/inmobiliaria';

interface TeamMemberCardProps {
  member: TeamMember;
  className?: string;
}

/**
 * Componente: Card de Miembro del Equipo (Simplificado)
 * 
 * Muestra:
 * - Foto circular (80x80px)
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
    <div className={`flex flex-col items-center text-center p-3 rounded-xl hover:bg-gray-50 transition-colors ${className}`}>
      {/* Foto del miembro */}
      <div className="relative w-20 h-20 mb-3 group">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            sizes="80px"
            className="rounded-full object-cover ring-4 ring-blue-100 shadow-md group-hover:ring-blue-200 transition-all"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-4 ring-blue-100 shadow-md group-hover:ring-blue-200 transition-all">
            <User className="w-10 h-10 text-blue-600" />
          </div>
        )}
      </div>

      {/* Nombre */}
      <h4 className="text-sm font-semibold text-gray-900">
        {member.name}
      </h4>
    </div>
  );
}
