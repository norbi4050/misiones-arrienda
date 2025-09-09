'use client';

import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export function UserMenu({ user }: { user?: { id?: string; name?: string; profile_image?: string } }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.profile_image ?? ''} alt={user?.name ?? 'Usuario'} />
          <AvatarFallback>{user?.name?.slice(0,2)?.toUpperCase() ?? 'US'}</AvatarFallback>
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
