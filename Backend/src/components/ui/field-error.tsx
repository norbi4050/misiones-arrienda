interface FieldErrorProps {
  error?: string | null
  fieldId?: string
}

export function FieldError({ error, fieldId }: FieldErrorProps) {
  if (!error) return null
  
  return (
    <div 
      id={fieldId ? `${fieldId}-error` : undefined}
      className="mt-1 text-sm text-red-600"
      role="alert"
    >
      {error}
    </div>
  )
}

export default FieldError
