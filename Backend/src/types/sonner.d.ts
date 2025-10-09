declare module 'sonner' {
  export const toast: {
    success: (message: string, options?: any) => void
    error: (message: string, options?: any) => void
    info?: (message: string, options?: any) => void
    warning?: (message: string, options?: any) => void
    (message: string, options?: any): void
  }
  export const Toaster: any
}
