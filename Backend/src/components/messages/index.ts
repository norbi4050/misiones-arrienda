// Exportaciones centralizadas de componentes de mensajería

// Componentes de unificación
export { MessageTabs } from './MessageTabs'
export { ConversationBadge } from './ConversationBadge'

// Componentes de adjuntos (existentes)
export { default as AttachmentButton } from './AttachmentButton'
export { default as AttachmentPreview } from './AttachmentPreview'
export { default as AttachmentLightbox } from './AttachmentLightbox'
export { default as UploadQueue, useUploadQueue } from './UploadQueue'
export type { QueuedFile, UploadStatus } from './UploadQueue'
