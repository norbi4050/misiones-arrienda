'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

/**
 * Check if a property is new (created within last 7 days)
 */
export function isNewProperty(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 7;
}

interface NewBadgeProps {
  createdAt: string;
}

export function NewBadge({ createdAt }: NewBadgeProps) {
  if (!isNewProperty(createdAt)) return null;

  return (
    <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg">
      <Sparkles className="h-3 w-3 mr-1" />
      NUEVO
    </Badge>
  );
}
