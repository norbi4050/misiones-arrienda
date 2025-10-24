import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function VerifiedBadge() {
  return (
    <Badge
      variant="default"
      className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white border-0 px-3 py-1.5 text-sm font-medium shadow-lg"
    >
      <CheckCircle2 className="w-4 h-4" />
      Verificado
    </Badge>
  );
}
