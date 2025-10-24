'use client';

interface PropertyTabsProps {
  activeTab: 'all' | 'venta' | 'alquiler';
  onTabChange: (tab: 'all' | 'venta' | 'alquiler') => void;
  counts: {
    all: number;
    venta: number;
    alquiler: number;
  };
}

export default function PropertyTabs({ activeTab, onTabChange, counts }: PropertyTabsProps) {
  const tabs = [
    { id: 'all' as const, label: 'Todas', count: counts.all },
    { id: 'venta' as const, label: 'Ventas', count: counts.venta },
    { id: 'alquiler' as const, label: 'Alquileres', count: counts.alquiler },
  ];

  return (
    <div className="flex gap-2 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-3 font-medium text-sm transition-colors relative
            ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {tab.label}
          <span
            className={`
              ml-2 px-2 py-0.5 rounded-full text-xs
              ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }
            `}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
