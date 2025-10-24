import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FounderBadge() {
  return (
    <Badge className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white border-0 px-3 py-1.5 text-sm font-medium shadow-lg">
      <Crown className="w-4 h-4" />
      Miembro Fundador
    </Badge>
  );
}
