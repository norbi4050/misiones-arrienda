import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExperienceBadgeProps {
  years: number;
}

export default function ExperienceBadge({ years }: ExperienceBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 px-3 py-1.5 text-sm font-medium shadow-md"
    >
      <Calendar className="w-4 h-4" />
      {years} {years === 1 ? 'año' : 'años'}
    </Badge>
  );
}
