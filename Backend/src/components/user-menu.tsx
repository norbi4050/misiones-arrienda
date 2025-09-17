'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export function UserMenu({ user: legacyUser }: { user?: { id?: string; name?: string; profile_image?: string } }) {
  const router = useRouter();
  const { user, profile, signOut, loading } = useUser();

  const onLogout = async () => {
    await signOut();
    router.push('/');
  };

  // Usar datos del contexto global si están disponibles, sino usar props legacy
  const userData = profile || legacyUser;
  const displayName = userData?.name || user?.email?.split('@')[0] || 'Usuario';
  const profileImage = userData?.profile_image || '';

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback>{displayName.slice(0,2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push('/profile/inquilino')}>Mi perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/profile/inquilino?tab=propiedades')}>Mis propiedades</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/publicar')}>Publicar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
