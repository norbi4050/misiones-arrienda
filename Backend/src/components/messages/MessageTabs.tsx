'use client'

import type { UnifiedMessageFilter } from '@/types/messages'

interface MessageTabsProps {
  activeTab: UnifiedMessageFilter
  onTabChange: (tab: UnifiedMessageFilter) => void
  counts: {
    all: number
    properties: number
    community: number
  }
}

export function MessageTabs({ activeTab, onTabChange, counts }: MessageTabsProps) {
  const tabs = [
    {
      id: 'all' as const,
      label: 'Todos',
      icon: '💬',
      count: counts.all
    },
    {
      id: 'properties' as const,
      label: 'Propiedades',
      icon: '🏠',
      count: counts.properties
    },
    {
      id: 'community' as const,
      label: 'Comunidad',
      icon: '👥',
      count: counts.community
    }
  ]

  return (
    <>
      {/* Desktop: Tabs horizontales */}
      <div className="hidden md:block border-b border-gray-200 bg-white">
        <nav className="flex space-x-8 px-6" aria-label="Message tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold
                    ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile: Dropdown selector */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <label htmlFor="message-type" className="sr-only">
          Tipo de mensaje
        </label>
        <select
          id="message-type"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as UnifiedMessageFilter)}
          className="block w-full rounded-lg border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.icon} {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
