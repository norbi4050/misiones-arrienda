import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de conversaciones */}
      <div className="w-full md:w-1/3 border-r bg-white">
        {/* Header */}
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Lista de conversaciones */}
        <div className="overflow-y-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b flex items-start space-x-3">
              {/* Avatar */}
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="hidden md:flex md:flex-1 flex-col items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    </div>
  )
}
