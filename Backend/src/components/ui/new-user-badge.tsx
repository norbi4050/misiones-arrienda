import { Badge } from '@/components/ui/badge'
import { isNewUser } from '@/lib/user-utils'

interface NewUserBadgeProps {
  userCreatedAt: string | Date
  className?: string
  variant?: 'default' | 'secondary' | 'outline'
}

export function NewUserBadge({ 
  userCreatedAt, 
  className = '', 
  variant = 'secondary' 
}: NewUserBadgeProps) {
  if (!isNewUser(userCreatedAt)) {
    return null
  }
  
  return (
    <Badge 
      variant={variant} 
      className={`bg-green-100 text-green-700 border-green-200 ${className}`}
    >
      ✨ Nuevo
    </Badge>
  )
}

export default NewUserBadge
