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
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Foto del miembro */}
      <div className="relative w-20 h-20 mb-3">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            sizes="80px"
            className="rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
            <User className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Nombre */}
      <h4 className="text-sm font-medium text-gray-900">
        {member.name}
      </h4>
    </div>
  );
}
