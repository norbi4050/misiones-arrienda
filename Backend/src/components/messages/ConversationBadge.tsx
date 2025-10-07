'use client'

import type { MessageType } from '@/types/messages'

interface ConversationBadgeProps {
  type: MessageType
  className?: string
}

export function ConversationBadge({ type, className = '' }: ConversationBadgeProps) {
  const config = {
    property: {
      icon: '🏠',
      label: 'Propiedad',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    community: {
      icon: '👥',
      label: 'Comunidad',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    }
  }

  const badge = config[type]

  return (
    <span 
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
        ${badge.bgColor} ${badge.textColor} ${badge.borderColor}
        ${className}
      `}
    >
      <span className="text-xs">{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  )
}
