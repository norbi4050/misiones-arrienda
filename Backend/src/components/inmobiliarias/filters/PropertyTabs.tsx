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
    <div className="flex gap-2 border-b-2 border-gray-200 bg-white rounded-t-xl px-2 pt-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-5 py-3 font-semibold text-sm transition-all duration-200 relative rounded-t-lg
            ${
              activeTab === tab.id
                ? 'text-blue-600 bg-blue-50 border-b-3 border-blue-600 -mb-0.5 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          {tab.label}
          <span
            className={`
              ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm
              ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
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
